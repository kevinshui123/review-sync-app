// ==========================================
// Automation & AI Agent Types
// ==========================================

export type AutomationType = 'reply-on-reviews' | 'analyze-reviews';

export type AutomationStatus = 'draft' | 'live' | 'paused';

export type ReplyMode = 'default' | 'ai-agent';

export type TriggerType = 'new-review' | 'all-reviews';

export type RatingFilter = 'all' | '5-stars' | '4-stars' | '3-stars' | '2-stars' | '1-star';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  tone: 'professional' | 'friendly' | 'empathetic' | 'custom';
  personality?: string;
  expertise?: string[];
  customInstructions?: string;
  model?: 'gemini' | 'openai';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  type: AutomationType;
  status: AutomationStatus;
  locationId: string;
  locationName?: string;
  trigger: TriggerType;
  ratingFilter: RatingFilter;
  replyMode: ReplyMode;
  defaultReply?: string;
  aiAgentId?: string;
  aiAgentName?: string;
  isEnabled: boolean;
  totalTriggered: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationFormData {
  name: string;
  type: AutomationType;
  locationId: string;
  trigger: TriggerType;
  ratingFilter: RatingFilter;
  replyMode: ReplyMode;
  defaultReply?: string;
  aiAgentId?: string;
}

export interface AnalyzeRule {
  id: string;
  name: string;
  locationId: string;
  trigger: TriggerType;
  ratingFilter: RatingFilter;
  reportType: 'sentiment' | 'competitor' | 'trend' | 'all';
  notifyEmail?: string;
  isEnabled: boolean;
}
