
import { GoogleGenAI, Type } from "@google/genai";
import { BlogInputs, GroundingSource, SEOScoreResult } from "../types";

export const generateFullSuperPage = async (
  inputs: BlogInputs, 
  onProgress?: (step: string) => void
): Promise<{ html: string; previewImageUrl: string; sources: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let