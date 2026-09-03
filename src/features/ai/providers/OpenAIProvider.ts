import OpenAI from 'openai';
import { IAIProvider } from './IAIProvider';
import { AIRequest, AIResponse, AIModelConfig, AIError } from '../types';
import { config } from '../../../config';
import { zodResponseFormat } from 'openai/helpers/zod';
import { ZodType } from 'zod';

export class OpenAIProvider implements IAIProvider {
  private client: OpenAI;

  constructor() {
    if (!config.ai.openaiKey) {
      throw new AIError('AI_CONFIG_ERROR', 'OpenAI API Key is missing from configuration');
    }
    this.client = new OpenAI({
      apiKey: config.ai.openaiKey,
      timeout: config.ai.requestTimeoutMs
    });
  }

  async generate(request: AIRequest, modelConfig: AIModelConfig): Promise<AIResponse> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userContext }
      ];

      const completionOptions: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
        model: modelConfig.model,
        messages,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
      };

      // Apply structured output formatting if a zod schema is provided
      if (request.responseSchema) {
        completionOptions.response_format = zodResponseFormat(request.responseSchema as ZodType, 'structured_output');
      }

      const response = await this.client.chat.completions.create(completionOptions);

      const choice = response.choices[0];
      const content = choice.message.content || '';

      let structuredData: any = undefined;
      if (request.responseSchema) {
        try {
          structuredData = JSON.parse(content);
          // Zod validation is handled automatically via response_format strictness, but we double check
          structuredData = request.responseSchema.parse(structuredData);
        } catch (e: any) {
          throw new AIError('AI_INVALID_OUTPUT', `Failed to parse structured output: ${e.message}`, e);
        }
      }

      return {
        requestId: request.requestId,
        content: request.responseSchema ? 'Structured output generated' : content,
        structuredData,
        model: response.model,
        provider: 'OPENAI',
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined
      };
    } catch (error: any) {
      if (error instanceof AIError) throw error;
      
      if (error.status === 429) {
        throw new AIError('AI_RATE_LIMITED', 'OpenAI provider rate limit exceeded', error);
      }
      if (error.code === 'ETIMEDOUT' || error.status === 408) {
        throw new AIError('AI_TIMEOUT', 'OpenAI provider timeout', error);
      }
      if (error.status >= 500) {
        throw new AIError('AI_PROVIDER_ERROR', 'OpenAI server error', error);
      }
      
      throw new AIError('AI_UNAVAILABLE', `OpenAI unexpected error: ${error.message}`, error);
    }
  }
}
