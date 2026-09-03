import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIProvider } from './IAIProvider';
import { AIRequest, AIResponse, AIModelConfig, AIError } from '../types';
import { config } from '../../../config';

export class GeminiProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (!config.ai.geminiKey) {
      throw new AIError('AI_CONFIG_ERROR', 'Gemini API Key is missing from configuration');
    }
    this.genAI = new GoogleGenerativeAI(config.ai.geminiKey);
  }

  async generate(request: AIRequest, modelConfig: AIModelConfig): Promise<AIResponse> {
    try {
      // For Gemini, we combine system and user prompts.
      let fullPrompt = request.systemPrompt ? `${request.systemPrompt}\n\n` : '';
      fullPrompt += request.userContext;

      if (request.responseSchema) {
        // Instruct Gemini to return JSON
        fullPrompt += `\n\nReturn ONLY a valid JSON object. Do not include markdown tags (\`\`\`json).`;
      }

      // We map the modelConfig.model to a valid Gemini model if it's currently using an OpenAI string
      let geminiModelStr = 'gemini-3.6-flash';
      if (modelConfig.model.includes('gemini')) {
        geminiModelStr = modelConfig.model;
      }

      const generativeModel = this.genAI.getGenerativeModel({ model: geminiModelStr });

      const result = await generativeModel.generateContent(fullPrompt);
      const response = result.response;
      const content = response.text();

      let structuredData: any = undefined;
      let finalContent = content;

      if (request.responseSchema) {
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        
        try {
          structuredData = JSON.parse(jsonStr.trim());
          structuredData = request.responseSchema.parse(structuredData);
          finalContent = 'Structured output generated';
        } catch (e: any) {
          throw new AIError('AI_INVALID_OUTPUT', `Failed to parse structured output: ${e.message}`, e);
        }
      }

      return {
        requestId: request.requestId,
        content: finalContent,
        structuredData,
        model: geminiModelStr,
        provider: 'GEMINI',
        // Note: usage is approximated or omitted as SDK might not provide identical token counts easily
        usage: undefined
      };
    } catch (error: any) {
      if (error instanceof AIError) throw error;
      
      // Map Gemini errors to AIError
      throw new AIError('AI_PROVIDER_ERROR', `Gemini unexpected error: ${error.message}`, error);
    }
  }
}
