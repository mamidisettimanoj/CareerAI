import { AIRequest, AIResponse, AIModelConfig } from '../types';

export interface IAIProvider {
  /**
   * Generates a response from the underlying LLM safely.
   */
  generate(request: AIRequest, config: AIModelConfig): Promise<AIResponse>;
}
