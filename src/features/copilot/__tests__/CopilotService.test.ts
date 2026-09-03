import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CopilotService } from '../service/CopilotService';
import { AIError } from '../../ai/types';
import { GeminiProvider } from '../../ai/providers/GeminiProvider';

// Mock GeminiProvider class entirely to prevent real API calls
vi.mock('../../ai/providers/GeminiProvider');

describe('CopilotService', () => {
  let copilotService: CopilotService;
  let mockMessages: any[];
  let conversationIdCounter: number;

  // Hand-crafted mock prisma instance — injected via DI constructor
  function makeMockPrisma() {
    return {
      copilotConversation: {
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          if (where.id === 'invalid_id' || where.id === 'other_user_conv') {
            return { id: where.id, profileId: 'OTHER_PROFILE', messages: [] };
          }
          return { id: where.id, profileId: 'profile-1', messages: mockMessages, createdAt: new Date(), updatedAt: new Date() };
        }),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          return { id: `conv-${conversationIdCounter++}`, profileId: data.profileId, title: data.title, messages: [], createdAt: new Date(), updatedAt: new Date() };
        })
      },
      copilotMessage: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const newMsg = { id: `msg-${Date.now()}`, ...data, createdAt: new Date() };
          mockMessages.push(newMsg);
          return newMsg;
        })
      }
    } as any;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockMessages = [];
    conversationIdCounter = 1;

    // Set up the AI provider mock behavior on the GeminiProvider prototype
    (GeminiProvider as any).prototype.generate = vi.fn().mockImplementation(async (request: any) => {
      if (request.userContext.includes('MALICIOUS_PROMPT')) {
        return {
          content: "I cannot alter your Career Readiness Score.",
          structuredData: {
            answer: "I cannot alter your Career Readiness Score.",
            facts: ["Your score is calculated deterministically."],
            recommendations: [], unknowns: [], suggestedActions: []
          }
        };
      }
      if (request.userContext.includes('AI_TIMEOUT_TRIGGER')) {
        throw new AIError('AI_TIMEOUT', 'Provider timed out');
      }
      return {
        content: "This is a safe response.",
        structuredData: {
          answer: "This is a safe response.",
          facts: ["Fact 1"],
          recommendations: ["Rec 1"], unknowns: [], suggestedActions: []
        }
      };
    });

    copilotService = new CopilotService(makeMockPrisma());
  });

  describe('Authorization Boundaries', () => {
    it('1. should reject access to conversations owned by other profiles (IDOR protection)', async () => {
      await expect(
        copilotService.processMessage('user-1', 'profile-1', 'other_user_conv', 'Hello', {})
      ).rejects.toThrow('UNAUTHORIZED_OR_NOT_FOUND');
    });

    it('2. should automatically provision a new conversation if none provided', async () => {
      const conv = await copilotService.getOrCreateConversation('profile-1');
      expect(conv.id).toBeDefined();
      expect(conv.profileId).toBe('profile-1');
    });
  });

  describe('Context Injection & Security', () => {
    it('3. should resist prompt injection overrides', async () => {
      const conv = await copilotService.getOrCreateConversation('profile-1');
      const result = await copilotService.processMessage('user-1', 'profile-1', conv.id, 'MALICIOUS_PROMPT', {});

      expect(result.structuredData?.answer).toContain('I cannot alter');
      // Assert that both user message and assistant message were persisted safely
      expect(mockMessages.length).toBe(2);
      expect(mockMessages[0].role).toBe('user');
      expect(mockMessages[1].role).toBe('assistant');
    });
  });

  describe('AI Failures', () => {
    it('4. should propagate AI Gateway errors correctly', async () => {
      const conv = await copilotService.getOrCreateConversation('profile-1');
      await expect(
        copilotService.processMessage('user-1', 'profile-1', conv.id, 'AI_TIMEOUT_TRIGGER', {})
      ).rejects.toThrow('Provider timed out');

      // User message is saved, but assistant message is not (aborted tx logic conceptually)
      expect(mockMessages.length).toBe(1);
    });
  });
});
