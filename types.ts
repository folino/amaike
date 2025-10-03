

// Fix: Updated GroundingSource to allow for optional web, uri, and title properties,
// matching the structure of GroundingChunk from the Gemini API response.
export interface GroundingSource {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  sources?: GroundingSource[];
}