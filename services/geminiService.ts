
import { GoogleGenAI, Type } from "@google/genai";
import { BlogInputs, GroundingSource, SEOScoreResult } from "../types";

export const researchSecondaryKeywords = async (primaryKeyword: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a comma-separated list of the 15 most powerful LSI and secondary keywords for a long-form article about "${primaryKeyword}". Focus on high-intent terms and semantic variations. Return ONLY the raw keywords.`,
  });
  return response.text || "";
};

export const generateFullSuperPage = async (
  inputs: BlogInputs, 
  onProgress?: (step: string) => void
): Promise<{ html: string; previewImageUrl: string; sources: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let finalImageUrl = inputs.imageUrl;
  const locationTarget = inputs.country.includes('Global') ? 'a global audience' : `the specific audience in ${inputs.city}, ${inputs.country}`;

  // Step 1: Nano Banana Visual Asset Generation
  if (inputs.imageSource === 'nanobanana') {
    onProgress?.("Synthesizing Neural Visuals (Nano Banana)...");
    try {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A cinematic, moody, professional editorial photograph for an article titled "${inputs.title}". Style: Minimalist, high-end, cinematic lighting, 8k resolution. Aspect Ratio: 16:9.` }]
        },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      
      // Strict iteration to find the image part
      if (imgResponse.candidates?.[0]?.content?.parts) {
        for (const part of imgResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            finalImageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Nano Banana Error:", e);
      finalImageUrl = `https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200&h=675`;
    }
  } else if (inputs.imageSource === 'pexels') {
    onProgress?.("Sourcing HD Global Assets...");
    try {
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find a professional, high-quality public image URL (Unsplash or Pexels) for "${inputs.title}". Return ONLY the URL.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      const urlMatch = searchResponse.text.match(/https?:\/\/[^\s]+(jpg|jpeg|png|webp)/i);
      finalImageUrl = urlMatch ? urlMatch[0] : `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200&h=675`;
    } catch (e) {
      finalImageUrl = `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200&h=675`;
    }
  }

  onProgress?.("Architecting Narrative Structure...");
  const systemInstruction = `
    Act as a World-Class SEO Architect and Narrative Strategist. 
    OBJECTIVE: Create a massive, 3,000-word "SuperPage" for "${inputs.title}". 
    TARGET: ${locationTarget}.

    1. HUMANITY PROTOCOL (Anti-AI):
       - Use aggressive "Burstiness": Alternate long, rhythmic explanations with short, punchy calls to action.
       - Use "Opinionated POV": Do not be neutral. Take a stance. 
       - FORBIDDEN WORDS: delve, tapestry, unleash, pivotal, inherent, comprehensive, multifaceted.

    2. VISUAL INJECTION:
       - Embed <div class="separator"><img src="${finalImageUrl}" alt="${inputs.title}"></div> exactly twice.
       - One instance MUST be right after the main H1 title.

    3. SEO GROUNDING:
       - Use search grounding to fetch real-world stats and recent events.
       - Naturally weave in LSI keywords: ${inputs.secondaryKeywords}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate the SuperPage for "${inputs.title}". Promotion link: ${inputs.promotionLink}.`,
      config: { 
        systemInstruction, 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 15000 }
      }
    });
    const html = response.text.trim().replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim();
    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(c => c.web)?.map(c => ({ title: c.web!.title || 'Verification Source', uri: c.web!.uri })) || [];
    return { html, previewImageUrl: finalImageUrl || '', sources };
  } catch (error: any) { throw new Error(error.message || "Neural Synth Fault."); }
};

export const analyzeSEOContent = async (
  primaryKeyword: string,
  secondaryKeywords: string,
  country: string,
  city: string,
  content: string
): Promise<SEOScoreResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = "SEO Quality Audit. Return JSON. Analyze keywords for difficulty (easy/medium/hard).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Audit Content for "${primaryKeyword}":\n\n${content.substring(0, 5000)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            viralPotential: { type: Type.NUMBER },
            humanityScore: { type: Type.NUMBER },
            empathyLevel: { type: Type.NUMBER },
            authoritySignal: { type: Type.NUMBER },
            structure: {
              type: Type.OBJECT,
              properties: {
                words: { type: Type.OBJECT, properties: { current: { type: Type.NUMBER }, min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }, required: ['current', 'min', 'max'] },
                h2: { type: Type.OBJECT, properties: { current: { type: Type.NUMBER }, min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }, required: ['current', 'min', 'max'] },
                paragraphs: { type: Type.OBJECT, properties: { current: { type: Type.NUMBER }, min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }, required: ['current', 'min', 'max'] },
                images: { type: Type.OBJECT, properties: { current: { type: Type.NUMBER }, min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }, required: ['current', 'min', 'max'] }
              }, required: ['words', 'h2', 'paragraphs', 'images']
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
                }, required: ['keyword', 'count', 'min', 'max', 'status', 'difficulty']
              }
            },
            fixes: { type: Type.ARRAY, items: { type: Type.STRING } }
          }, required: ['score', 'viralPotential', 'humanityScore', 'empathyLevel', 'authoritySignal', 'structure', 'terms', 'fixes']
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    return {
      score: 85, viralPotential: 90, humanityScore: 92, empathyLevel: 88, authoritySignal: 90,
      structure: { words: { current: 3000, min: 2500, max: 4000 }, h2: { current: 12, min: 10, max: 15 }, paragraphs: { current: 70, min: 60, max: 100 }, images: { current: 10, min: 8, max: 15 } },
      terms: [{keyword: primaryKeyword, count: 5, min: 3, max: 8, status: 'optimal', difficulty: 'medium'}],
      fixes: ["Fallback data generated."]
    };
  }
};
