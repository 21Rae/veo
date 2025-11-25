import { GoogleGenAI } from "@google/genai";
import { GenerationRequest } from "../types";

// Helper to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const key = process.env.API_KEY;
    if (key) {
      this.ai = new GoogleGenAI({ apiKey: key });
    }
  }

  private ensureInitialized() {
    const key = process.env.API_KEY;
    if (!key) {
      throw new Error("API Key not found. Please select a key.");
    }
    // Always re-create instance to ensure fresh config
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async generateVideo(request: GenerationRequest): Promise<string> {
    this.ensureInitialized();
    if (!this.ai) throw new Error("AI Service failed to initialize");

    const { prompt, image, config } = request;

    console.log("Starting video generation...", { prompt, hasImage: !!image, config });

    try {
      // Choose model based on whether we want fast preview or high quality.
      const modelName = 'veo-3.1-fast-generate-preview';

      // Construct payload
      const generateConfig = {
        numberOfVideos: 1,
        resolution: config.resolution,
        aspectRatio: config.aspectRatio,
      };

      let operation;

      if (image) {
        // Text + Image to Video
        operation = await this.ai.models.generateVideos({
          model: modelName,
          prompt: prompt,
          image: {
            imageBytes: image.data,
            mimeType: image.mimeType,
          },
          config: generateConfig,
        });
      } else {
        // Text to Video
        operation = await this.ai.models.generateVideos({
          model: modelName,
          prompt: prompt,
          config: generateConfig,
        });
      }

      console.log("Operation started. Polling for completion...", operation);

      // Poll loop
      while (!operation.done) {
        await wait(5000); // Wait 5 seconds between polls
        operation = await this.ai!.operations.getVideosOperation({ operation: operation });
        console.log("Polling status...", operation);
        
        // Safety check for errors during polling
        if (operation.error) {
           throw new Error(operation.error.message || "Unknown error during video generation");
        }
      }

      // Check for errors in the operation response
      if (operation.error) {
        throw new Error(operation.error.message || "Unknown error during video generation");
      }

      // Extract URI
      const generatedVideos = operation.response?.generatedVideos;
      if (!generatedVideos || generatedVideos.length === 0) {
        throw new Error("No video returned from the API.");
      }

      const videoUri = generatedVideos[0].video?.uri;
      if (!videoUri) {
        throw new Error("Video URI is missing.");
      }

      // Fetch the actual video file. 
      // CRITICAL: Must append API key to the download link.
      const key = process.env.API_KEY;
      const downloadUrl = videoUri.includes('?') 
        ? `${videoUri}&key=${key}` 
        : `${videoUri}?key=${key}`;
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      return objectUrl;

    } catch (error: any) {
      console.error("Video Generation Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();