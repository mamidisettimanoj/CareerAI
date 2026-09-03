'use server';

import { requireCareerUser } from '@/lib/auth';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { calculateAssessmentScore } from '@/domain/assessment/engine/AssessmentScoringEngine';
import { AssessmentAnswerDef } from '@/domain/assessment/types/assessment.types';
import { revalidatePath } from 'next/cache';

export async function getAssessmentsAction() {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) throw new Error('Profile not found');
  
  return serverRepositories.assessment.getAvailableAssessments();
}

export async function startAssessmentAttemptAction(versionId: string) {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) throw new Error('Profile not found');

  const version = await serverRepositories.assessment.getAssessmentVersion(versionId);
  if (!version) throw new Error('Assessment version not found');

  // Prevent starting if there's already an active attempt (optional, based on rules)
  // We'll just create a new one.

  const attempt = await serverRepositories.assessment.startAttempt(profileId, versionId);

  // Return the attempt ID to the client
  return attempt;
}

export async function getAssessmentAttemptAction(attemptId: string) {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) throw new Error('Profile not found');

  const attempt = await serverRepositories.assessment.getAttempt(attemptId);
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.profileId !== profileId) throw new Error('Unauthorized');

  // Strip `isCorrect` from options before sending to client to prevent cheating
  const safeAttempt = {
    ...attempt,
    version: {
      ...attempt.version,
      questions: attempt.version.questions.map((q: any) => ({
        ...q,
        options: q.options.map((o: any) => ({
          id: o.id,
          text: o.text,
          order: o.order
        }))
      }))
    }
  };

  return safeAttempt;
}

export async function submitAssessmentAttemptAction(attemptId: string, answers: AssessmentAnswerDef[]) {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) throw new Error('Profile not found');

  const attempt = await serverRepositories.assessment.getAttempt(attemptId);
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.profileId !== profileId) throw new Error('Unauthorized');
  
  if (attempt.status === 'COMPLETED') {
    throw new Error('Attempt already submitted');
  }

  // Load authoritative version with answer keys
  const version = await serverRepositories.assessment.getAssessmentVersion(attempt.versionId);
  
  // Calculate authoritative score
  const resultData = calculateAssessmentScore(version, answers, { negativeMarking: false, marksPerQuestion: 1 });

  // Save the result
  const completedAttempt = await serverRepositories.assessment.submitAttempt(attemptId, answers, resultData);

  revalidatePath('/assessments');
  revalidatePath('/predict');
  revalidatePath('/dashboard');
  
  return completedAttempt;
}
