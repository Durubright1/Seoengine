
import { GoogleGenAI, Type } from "@google/genai";
import { BlogInputs, GroundingSource, SEOScoreResult } from "../types";

export const generateFullSuperPage = async (
  inputs: BlogInputs, 
  onProgress?: (step: string) => void
): Promise<{ html: string; previewImageUrl: string; sources: GroundingSource[] }> => {
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

  onProgress?.("Scanning Web for Rapid Virality Triggers...");
  
  const systemInstruction = `
    Act as a World-Class SEO Architect and Viral Content Specialist.
    Topic: "${inputs.title}"
    Primary Intent: ${inputs.intent}
    Tone: ${inputs.tone} - Priority: 100% HUMANIZED. Relatable, conversational, and authoritative. 
    Location Focus: ${inputs.city}, ${inputs.country} (Local SEO).
    
    CONTENT PROTOCOL:
    1. Hook: Start with a deeply human, emotional or curious hook. Avoid robotic AI intros.
    2. Narrative: Use a storytelling approach. Vary sentence length for rhythm.
    3. Multimedia: Include at least 2 [IMAGE_PLACEHOLDER: descriptive prompt] tags for later image insertion.
    4. Strategic Brief: Seamlessly integrate these details: "${inputs.customInstructions}"
    5. Local SEO: Specifically mention ${inputs.city} or relevant local landmarks/trends if they fit the topic.
    
    HTML STRUCTURE (Optimized for Blogger):
    - <h1> for Title.
    - Use <h2> and <h3> for subheadings.
    - <blockquote> for key authority quotes.
    - <ul> and <li> for punchy lists.
    - Word count: 1800-3500 words for deep-dive authority.
    - Natural integration of: "${inputs.secondaryKeywords}".
    
    Output Format: RAW HTML ONLY. No markdown wrappers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a high-performance, viral, humanized superpage about "${inputs.title}" optimized for ${inputs.city}, ${inputs.country}. Incorporate "${inputs.secondaryKeywords}".`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 10000 }
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
    Act as a pro SEO Intelligence tool (like Surfer SEO). 
    Audit content for "${primaryKeyword}" targeting ${city}, ${country}.

    DIFFICULTY CLASSIFICATION for 'difficulty' field:
    - "easy": Low competition, high opportunity (Green UI).
    - "medium": Moderate competition (Yellow UI).
    - "hard": High competition, requires high authority (Red UI).

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
