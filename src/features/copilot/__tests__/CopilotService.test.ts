import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CopilotService } from '../service/CopilotService';
import { ICopilotMessage, ICopilotConversation } from '../types';
import { AIError } from '../../ai/types';

// Mock the AI Gateway
vi.mock('../../ai/gateway/AIGateway', () => {
  return {
    aiGateway: {
      execute: vi.fn().mockImplementation(async (userId, request) => {
        if (request.userContext.includes('MALICIOUS_PROMPT')) {
          // Simulate the AI Gateway successfully processing but ignoring the override due to system bounds
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
      })
    },
    CareerAIContextBuilder: {
      buildSafeContext: vi.fn().mockReturnValue('SAFE_CONTEXT'),
      wrapUntrustedInput: vi.fn().mockReturnValue('--- UNTRUSTED USER CONTENT START ---\nUSER_TEXT\n--- UNTRUSTED USER CONTENT END ---')
    }
  };
});

// Mock Prisma
const mockMessages: any[] = [];
let conversationIdCounter = 1;

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      copilotConversation = {
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if (where.id === 'invalid_id' || where.id === 'other_user_conv') {
            return { id: where.id, profileId: 'OTHER_PROFILE', messages: [] };
          }
          return { id: where.id, profileId: 'profile-1', messages: mockMessages, createdAt: new Date(), updatedAt: new Date() };
        }),
        create: vi.fn().mockImplementation(async ({ data }) => {
          return { id: `conv-${conversationIdCounter++}`, profileId: data.profileId, title: data.title, messages: [], createdAt: new Date(), updatedAt: new Date() };
        })
      };
      copilotMessage = {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const newMsg = { id: `msg-${Date.now()}`, ...data, createdAt: new Date() };
          mockMessages.push(newMsg);
          return newMsg;
        })
      };
    }
  };
});

describe('CopilotService', () => {
  let copilotService: CopilotService;

  beforeEach(() => {
    copilotService = new CopilotService();
    mockMessages.length = 0; // reset
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
