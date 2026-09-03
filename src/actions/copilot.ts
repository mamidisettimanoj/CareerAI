'use server';

import { requireCareerUser } from '@/lib/auth';
import { copilotService } from '@/features/copilot/service/CopilotService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sends a message to the Copilot securely.
 */
export async function sendCopilotMessageAction(conversationId: string, messageText: string) {
  try {
    const user = await requireCareerUser();
    const userId = user.id;
    const profileId = user.profile?.id;
    
    if (!profileId) {
      throw new Error('User profile not found.');
    }

    // Fetch the minimum deterministic context required for the AI Coach
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        skills: true,
        readinessSnapshots: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    const domainContext = {
      profile: { targetRole: profile?.targetRole },
      skills: profile?.skills,
      engineResult: {
        overallScore: profile?.readinessSnapshots?.[0]?.overallScore,
        priorityImprovements: profile?.readinessSnapshots?.[0]?.priorityImprovements
      }
    };

    const result = await copilotService.processMessage(
      userId,
      profileId,
      conversationId,
      messageText,
      domainContext
    );

    return { success: true, message: result };
  } catch (error: any) {
    return handleActionError(error);
  }
}

/**
 * Initializes or fetches a conversation context for the dashboard UI.
 */
export async function getActiveConversationAction() {
  try {
    const user = await requireCareerUser();
    const profileId = user.profile?.id;
    
    if (!profileId) {
      throw new Error('User profile not found.');
    }
    
    // Find the most recent conversation or create a new one
    let conv = await prisma.copilotConversation.findFirst({
      where: { profileId },
      orderBy: { updatedAt: 'desc' }
    });

    const conversation = await copilotService.getOrCreateConversation(profileId, conv?.id);

    return { success: true, conversation };
  } catch (error: any) {
    return handleActionError(error);
  }
}
