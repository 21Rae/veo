export interface Message {
  id: string;
  role: 'user' | 'agent';
  text?: string;
  image?: string; // Base64 string of the uploaded image
  videoUrl?: string; // Blob URL for generated video
  status?: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
  timestamp: number;
}

export type AspectRatio = '16:9' | '9:16';
export type Resolution = '720p' | '1080p';

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  resolution: Resolution;
}

export interface GenerationRequest {
  prompt: string;
  image?: {
    data: string; // Base64
    mimeType: string;
  };
  config: GenerationConfig;
}

// Global declaration for the AI Studio window object
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}