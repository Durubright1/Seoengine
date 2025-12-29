
export type ImageSource = 'pexels' | 'unsplash' | 'custom';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BlogInputs {
  title: string;
  secondaryKeywords: string;
  country: string;
  city: string;
  intent: string;
  niche: string;
  language: string;
  tone: string;
  audience: string;
  imageSource: ImageSource;
  imageUrl: string;
  promotionLink: string;
  customInstructions: string;
  activeProtocols: string[]; // New: Tracks active humanization protocols
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GeneratedBlog {
  id: string;
  timestamp: number;
  title: string;
  htmlContent: string;
  previewImageUrl?: string;
  inputs: BlogInputs;
  sources: GroundingSource[];
  seoResult?: SEOScoreResult;
}

export enum SearchIntent {
  Informational = 'Informational',
  Transactional = 'Transactional',
  Commercial = 'Commercial',
  Navigational = 'Navigational'
}

export interface Country {
  name: string;
  code: string;
  capital: string;
  cities: string[];
}

export interface KeywordMetric {
  keyword: string;
  count: number;
  min: number;
  max: number;
  volume: number;
  difficulty: number; // 0-100
  status: 'low' | 'optimal' | 'high' | 'missing';
}

export interface SEOScoreResult {
  score: number;
  humanityScore: number; 
  burstinessIndex: number; 
  authoritySignal: number; 
  sentiment: 'positive' | 'neutral' | 'analytical';
  structure: {
    words: { current: number; min: number; max: number };
    h2: { current: number; min: number; max: number };
    paragraphs: { current: number; min: number; max: number };
    images: { current: number; min: number; max: number };
  };
  terms: KeywordMetric[];
  fixes: string[];
}
