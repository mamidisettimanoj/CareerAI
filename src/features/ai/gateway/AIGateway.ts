import { IAIProvider } from '../providers/IAIProvider';
import { GeminiProvider } from '../providers/GeminiProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { AIRequest, AIResponse, AIModelConfig, AIError } from '../types';
import { config } from '../../../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * AIGateway is the central routing and governance layer for all LLM calls.
 * - Handles rate limiting (stubbed in-memory for MVP)
 * - Handles retries with exponential backoff
 * - Injects Request IDs for observability
 */
export class AIGateway {
  private provider: IAIProvider;
  
  // In-memory rate limiter (Documented limitation: requires Redis for prod)
  private rateLimitMap = new Map<string, { count: number; timestamp: number }>();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  constructor() {
    // If we have a Gemini Key, we prefer GeminiProvider.
    // Otherwise fallback to OpenAI if configured.
    if (config.ai.geminiKey) {
      this.provider = new GeminiProvider();
    } else {
      this.provider = new OpenAIProvider();
    }
  }

  /**
   * Executes a safe AI request.
   * @param userId The authenticated user ID (never trust client-supplied ID, pass from session)
   * @param request The structured request payload
   * @param overrideConfig Optional specific model configs
   */
  async execute(userId: string, request: Omit<AIRequest, 'requestId'>, overrideConfig?: Partial<AIModelConfig>): Promise<AIResponse> {
    this.enforceRateLimit(userId);

    const fullRequest: AIRequest = {
      ...request,
      requestId: uuidv4()
    };

    const modelConfig: AIModelConfig = {
      provider: config.ai.geminiKey ? 'GEMINI' : 'OPENAI',
      model: config.ai.geminiKey ? 'gemini-3.6-flash' : config.ai.defaultModel,
      temperature: 0.7,
      ...overrideConfig
    };

    const startTime = Date.now();
    try {
      const response = await this.executeWithRetry(fullRequest, modelConfig, 3);
      
      const latency = Date.now() - startTime;
      this.logObservability(userId, fullRequest, response, latency);
      
      return response;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.logObservabilityError(userId, fullRequest, error, latency);
      throw error;
    }
  }

  private enforceRateLimit(userId: string) {
    const now = Date.now();
    const windowStart = now - 60000;
    
    const record = this.rateLimitMap.get(userId);
    if (!record || record.timestamp < windowStart) {
      this.rateLimitMap.set(userId, { count: 1, timestamp: now });
      return;
    }

    if (record.count >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new AIError('AI_RATE_LIMITED', `Rate limit exceeded for user ${userId}. Maximum ${this.MAX_REQUESTS_PER_MINUTE} requests per minute.`);
    }

    record.count++;
  }

  private async executeWithRetry(request: AIRequest, config: AIModelConfig, maxRetries: number): Promise<AIResponse> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await this.provider.generate(request, config);
      } catch (error: any) {
        attempt++;
        if (error instanceof AIError && (error.code === 'AI_RATE_LIMITED' || error.code === 'AI_TIMEOUT' || error.code === 'AI_PROVIDER_ERROR')) {
          if (attempt >= maxRetries) throw error;
          
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Do not retry invalid configurations, parsing errors, or non-retryable issues
          throw error;
        }
      }
    }
    throw new AIError('AI_UNAVAILABLE', 'Maximum retries exceeded');
  }

  private logObservability(userId: string, req: AIRequest, res: AIResponse, latency: number) {
    // Log structured usage but omit raw PII Context/Prompts to avoid retention leaks
    console.log(`[AI_USAGE] SUCCESS | ReqID:${req.requestId} | User:${userId} | Task:${req.taskType} | Model:${res.model} | Latency:${latency}ms | Tokens:${res.usage?.totalTokens || 'unknown'}`);
  }

  private logObservabilityError(userId: string, req: AIRequest, error: any, latency: number) {
    console.error(`[AI_USAGE] ERROR | ReqID:${req.requestId} | User:${userId} | Task:${req.taskType} | ErrorCode:${error.code || 'UNKNOWN'} | Latency:${latency}ms | Message:${error.message}`);
  }
}

export const aiGateway = new AIGateway();
