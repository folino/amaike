
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

// El Eco API types
export interface ElecoApiResponse {
  current_page: number;
  data: ElecoArticle[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface ElecoArticle {
  id: number;
  slug: string;
  title: string;
  title_home: string;
  volanta: string;
  format: string;
  copete: string;
  epigrafe: string;
  featured_image: string;
  excerpt: string;
  keywords: string[];
  content: string | null;
  content_premium: string | null;
  is_premium: boolean;
  photographer: string | null;
  author: {
    display_name: string;
    avatar: string;
    description: string;
    social_networks: any;
    slug: string;
    feed: string;
    biography: string | null;
  };
  created_at: string;
  updated_at: string;
  link_note: string;
  link_note_alternative: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  enable_comments: number;
  tags: any;
  reading_time: number;
  focal_point_image: any;
  entities: any[];
  next: any;
}

export interface SearchKeywords {
  primary: string;
  secondary: string[];
}