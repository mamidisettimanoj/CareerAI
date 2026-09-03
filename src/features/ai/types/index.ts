export type AITaskType = 
  | 'RESUME_FEEDBACK'
  | 'CAREER_EXPLANATION'
  | 'SKILL_EXPLANATION'
  | 'PROJECT_RECOMMENDATION'
  | 'ROADMAP_ENRICHMENT'
  | 'GENERAL_COACHING';

export interface AIModelConfig {
  provider: 'OPENAI' | 'GEMINI' | 'ANTHROPIC';
  model: string;
  temperature: number;
  maxTokens?: number;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIRequest {
  requestId: string;
  taskType: AITaskType;
  systemPrompt: string;
  userContext: string;
  responseSchema?: any; // Zod schema definition if structured output is needed
}

export interface AIResponse<T = any> {
  requestId: string;
  content: string;
  structuredData?: T;
  model: string;
  provider: string;
  usage?: AIUsage;
}

export class AIError extends Error {
  constructor(
    public code: 'AI_CONFIG_ERROR' | 'AI_PROVIDER_ERROR' | 'AI_RATE_LIMITED' | 'AI_TIMEOUT' | 'AI_INVALID_OUTPUT' | 'AI_UNAVAILABLE',
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}
