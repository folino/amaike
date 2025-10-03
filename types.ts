
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

// Enhanced data collection interfaces
export interface NewsTip {
  id: string;
  timestamp: Date;
  userMessage: string;
  collectedData: CollectedInformation;
  status: 'collecting' | 'ready_to_submit' | 'submitted' | 'failed';
  submissionId?: string;
}

export interface CollectedInformation {
  what: string;           // What happened
  when: string;           // When it happened
  where: string;          // Where it happened
  who: string;            // Who was involved
  how: string;            // How it happened
  additionalDetails: string; // Any additional context
  contactInfo?: string;   // Optional contact information
  urgency: 'low' | 'medium' | 'high'; // Urgency level
  category: 'accident' | 'crime' | 'politics' | 'community' | 'business' | 'other';
}

export interface TipSubmission {
  tipId: string;
  collectedData: CollectedInformation;
  originalMessage: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface SubmissionResponse {
  success: boolean;
  submissionId?: string;
  message: string;
  error?: string;
}