import { GoogleGenAI, Type } from "@google/genai";
import { BlogInputs, GroundingSource, SEOScoreResult } from "../types";

export const generateFullSuperPage = async (
  inputs: BlogInputs, 
  onProgress?: (step: string) => void
): Promise<{ html: string; previewImageUrl: string; sources: GroundingSource[] }> => {
  // Re-initialize for every call to catch the latest API key from selection dialog
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let finalImageUrl = inputs.imageUrl;

  if (inputs.imageSource === 'nanobanana') {
    onProgress?.("Designing Viral Editorial Visual...");
    try {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Stunning, viral-style humanized editorial header for a blog titled "${inputs.title}". Vibe: authentic, relatable, ${inputs.niche} lifestyle, hyper-realistic, 4k. Cinematic lighting. 16:9 ratio.` }]
        },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      
      const imgPart = imgResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imgPart?.inlineData) {
        finalImageUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
      }
    } catch (e) {
      finalImageUrl = `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=1200&h=675`;
    }
  }

  onProgress?.("Performing Deep Internet Research...");
  
  const systemInstruction = `
    Act as a World-Class SEO Architect, Investigative Journalist, and Affiliate Marketing Expert.
    
    RESEARCH MISSION:
    1. Search for the top 5 ranking articles for "${inputs.title}".
    2. Identify "Content Gaps" - what are they missing that users in ${inputs.city} actually want to know?
    3. Find current trending data, statistics, or news related to ${inputs.niche} in ${inputs.country}.
    
    CONTENT ARCHITECTURE:
    - Topic: "${inputs.title}"
    - Tone: 100% HUMANIZED. Use first-person perspectives ("I noticed...", "Many of my clients in ${inputs.city} ask...").
    - Affiliate Strategy: If a promotion link is provided ("${inputs.promotionLink}"), naturally weave it into a "Pro Recommendation" section or as a contextual solution to a problem discussed. Ensure the CTA (Call to Action) is high-converting but helpful, not spammy.
    - Local Authority: Mention local landmarks, specific ${inputs.city} vibes, or regional regulations/trends to win the Local SEO game.
    
    HTML STRUCTURE (Blogger-Ready):
    - <h1> for Title.
    - <h2> and <h3> for subheadings with power words.
    - <blockquote> for industry authority quotes found during research.
    - [IMAGE_PLACEHOLDER: descriptive prompt] tags (at least 3).
    - A "Quick Summary" or "Key Takeaways" box using a <div> with inline styles for a modern look.
    
    Output Format: RAW HTML ONLY. No markdown wrappers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform internet research and then write a 2500-word humanized superpage about "${inputs.title}". 
      Include local context for ${inputs.city}, ${inputs.country}. 
      Use these keywords: "${inputs.secondaryKeywords}". 
      Strategic promotion link: "${inputs.promotionLink}". 
      Custom brief: "${inputs.customInstructions}"`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 15000 }
      }
    });

    const html = response.text.trim().replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim();
    
    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(c => c.web)
      ?.map(c => ({ title: c.web!.title || 'Reference Link', uri: c.web!.uri })) || [];

    return { html, previewImageUrl: finalImageUrl || '', sources };
  } catch (error: any) {
    throw new Error(error.message || "Generation sequence interrupted.");
  }
};

export const analyzeSEOContent = async (
  primaryKeyword: string,
  secondaryKeywords: string,
  country: string,
  city: string,
  content: string
): Promise<SEOScoreResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    Act as a pro SEO Intelligence tool. Audit content for "${primaryKeyword}" targeting ${city}, ${country}.
    Check for:
    1. Keyword density (natural vs stuffed).
    2. LSI usage.
    3. Readability (Flesch-Kincaid).
    4. Local relevance markers.
    5. Conversion optimization (presence of CTA/Link).

    Return JSON matching the SEOScoreResult interface.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Audit this blog content. Primary: ${primaryKeyword}. Secondary: ${secondaryKeywords}.\n\nContent:\n${content}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            structure: {
              type: Type.OBJECT,
              properties: {
                words: { type: Type.OBJECT, properties: { current: { type: Type.NUMBER }, min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }, required: ['current', 'min', 'max'] },
                h2: { type: Type.OBJECT, properties: { current: { type: Type.NUMBER }, min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }, required: ['current', 'min', 'max'] },
                paragraphs: { type: Type.OBJECT, properties: { current: { type: Type.NUMBER }, min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }, required: ['current', 'min', 'max'] },
                images: { type: Type.OBJECT, properties: { current: { type: Type.NUMBER }, min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }, required: ['current', 'min', 'max'] }
              },
              required: ['words', 'h2', 'paragraphs', 'images']
            },
            terms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  count: { type: Type.NUMBER },
                  min: { type: Type.NUMBER },
                  max: { type: Type.NUMBER },
                  status: { type: Type.STRING },
                  difficulty: { type: Type.STRING }
                },
                required: ['keyword', 'count', 'min', 'max', 'status', 'difficulty']
              }
            },
            fixes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['score', 'structure', 'terms', 'fixes']
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    return {
      score: 0,
      structure: { words: { current: 0, min: 1500, max: 3000 }, h2: { current: 0, min: 8, max: 15 }, paragraphs: { current: 0, min: 20, max: 40 }, images: { current: 1, min: 3, max: 8 } },
      terms: [],
      fixes: ["Audit failed."]
    };
  }
};