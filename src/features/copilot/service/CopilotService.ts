import { PrismaClient } from '@prisma/client';
import { aiGateway, CareerAIContextBuilder } from '../../ai';
import { COPILOT_SYSTEM_PROMPT } from '../prompts';
import { CopilotResponseSchema, CopilotStructuredOutput } from '../validation';
import { ICopilotConversation, ICopilotMessage } from '../types';

const prismaDefault = new PrismaClient();

export class CopilotService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prismaDefault;
  }

  /**
   * Retrieves or creates a conversation for a profile.
   */
  async getOrCreateConversation(profileId: string, conversationId?: string): Promise<ICopilotConversation> {
    if (conversationId) {
      const conv = await this.prisma.copilotConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
      if (!conv || conv.profileId !== profileId) {
        throw new Error('UNAUTHORIZED_OR_NOT_FOUND');
      }
      return this.mapConversation(conv);
    }

    const newConv = await this.prisma.copilotConversation.create({
      data: { profileId, title: 'Career Coaching Session' },
      include: { messages: true }
    });
    return this.mapConversation(newConv);
  }

  /**
   * Executes a conversational turn securely.
   */
  async processMessage(
    userId: string,
    profileId: string,
    conversationId: string,
    messageText: string,
    domainContext: any
  ): Promise<ICopilotMessage> {
    // 1. Verify ownership
    const conversation = await this.getOrCreateConversation(profileId, conversationId);

    // 2. Wrap user input securely
    const safeUserInput = CareerAIContextBuilder.wrapUntrustedInput(messageText);

    // 3. Build Career Context
    const systemContextBlock = CareerAIContextBuilder.buildSafeContext(domainContext);

    // 4. Extract conversation history (last 5 messages to preserve context window)
    const historyText = conversation.messages.slice(-5).map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n');

    // 5. Combine Contexts
    const fullUserContext = `
${systemContextBlock}

--- CONVERSATION HISTORY ---
${historyText}

${safeUserInput}
    `.trim();

    // 6. Save User Message
    await this.prisma.copilotMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: messageText
      }
    });

    // 7. Execute AI Gateway
    const response = await aiGateway.execute(userId, {
      taskType: 'GENERAL_COACHING',
      systemPrompt: COPILOT_SYSTEM_PROMPT,
      userContext: fullUserContext,
      responseSchema: CopilotResponseSchema
    });

    // 8. Save Assistant Message
    const assistantMessage = await this.prisma.copilotMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: response.content,
        structuredData: response.structuredData || null
      }
    });

    return {
      id: assistantMessage.id,
      role: 'assistant',
      content: assistantMessage.content,
      structuredData: assistantMessage.structuredData as CopilotStructuredOutput,
      createdAt: assistantMessage.createdAt
    };
  }

  private mapConversation(record: any): ICopilotConversation {
    return {
      id: record.id,
      profileId: record.profileId,
      title: record.title,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      messages: record.messages.map((m: any) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        structuredData: m.structuredData,
        createdAt: m.createdAt
      }))
    };
  }
}

export const copilotService = new CopilotService();
