
import { GoogleGenAI, Type } from "@google/genai";
import { BlogInputs, GroundingSource, SEOScoreResult } from "../types";

export const researchSecondaryKeywords = async (primaryKeyword: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a comma-separated list of the 15 most powerful LSI and secondary keywords for an article about "${primaryKeyword}". Focus on high-intent terms. Return ONLY the keywords.`,
  });
  return response.text || "";
};

export const generateFullSuperPage = async (
  inputs: BlogInputs, 
  onProgress?: (step: string) => void
): Promise<{ html: string; previewImageUrl: string; sources: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let finalImageUrl = inputs.imageUrl;
  const isGlobal = inputs.country.includes('Global') || inputs.country === 'Global';

  // Nano Banana Implementation
  if (inputs.imageSource === 'nanobanana') {
    onProgress?.("Generating Neural Visual (Nano Banana)...");
    try {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A cinematic, ultra-high-definition professional editorial photograph for an article titled "${inputs.title}". Style: Minimalist, premium, high-contrast, moody lighting. 16:9 Aspect Ratio.` }]
        },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      
      // Strict part iteration as per documentation
      for (const part of imgResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          finalImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (e) {
      console.error("Nano Banana Error:", e);
      finalImageUrl = `https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200&h=675`;
    }
  } else if (inputs.imageSource === 'pexels') {
    onProgress?.("Fetching High-Resolution Asset (Pexels)...");
    try {
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a direct high-quality Unsplash or Pexels image URL (jpg/png) that visually represents "${inputs.title}". Return ONLY the raw URL.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      const urlMatch = searchResponse.text.match(/https?:\/\/[^\s]+(jpg|jpeg|png|webp)/i);
      finalImageUrl = urlMatch ? urlMatch[0] : `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200&h=675`;
    } catch (e) {
      finalImageUrl = `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200&h=675`;
    }
  }

  onProgress?.("Writing Humanity-First Narrative...");
  const systemInstruction = `
    Act as a World-Class Narrative Architect. 
    OBJECTIVE: Create a 3,000-word "SuperPage" for "${inputs.title}" that is UNAPOLOGETICALLY HUMAN.

    1. HUMANITY PROTOCOL:
       - Vary sentence lengths aggressively.
       - Use specific personal anecdotes or "Vulnerability Anchors".
       - Avoid all generic AI transitions like "In conclusion" or "Furthermore".

    2. IMAGE INJECTION:
       - You MUST place exactly two <img src="${finalImageUrl}" alt="${inputs.title}" class="full-width-asset"> tags in the document.
       - Place one after the H1 and one before the final call to action.

    3. PROMOTION:
       - Integrate "${inputs.promotionLink}" naturally as a high-value resource.

    4. SEO GROUNDING:
       - Use search grounding for current facts and figures.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Draft the SuperPage for "${inputs.title}". Keywords to include: ${inputs.secondaryKeywords}. Tone: ${inputs.tone}.`,
      config: { systemInstruction, tools: [{ googleSearch: {} }], thinkingConfig: { thinkingBudget: 15000 } }
    });
    const html = response.text.trim().replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim();
    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(c => c.web)?.map(c => ({ title: c.web!.title || 'Source', uri: c.web!.uri })) || [];
    return { html, previewImageUrl: finalImageUrl || '', sources };
  } catch (error: any) { throw new Error(error.message || "Neural protocol failure."); }
};

export const analyzeSEOContent = async (
  primaryKeyword: string,
  secondaryKeywords: string,
  country: string,
  city: string,
  content: string
): Promise<SEOScoreResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = "Act as an SEO Quality Auditor. Return JSON ONLY.";

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
      score: 80, viralPotential: 85, humanityScore: 90, empathyLevel: 85, authoritySignal: 88,
      structure: { words: { current: 3000, min: 2500, max: 4000 }, h2: { current: 12, min: 10, max: 15 }, paragraphs: { current: 70, min: 60, max: 100 }, images: { current: 10, min: 8, max: 15 } },
      terms: [{keyword: "content", count: 12, min: 5, max: 15, status: 'optimal', difficulty: 'easy'}],
      fixes: ["Internal audit failed, returning defaults."]
    };
  }
};
