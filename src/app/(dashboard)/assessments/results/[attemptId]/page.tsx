import { requireCareerUser } from '@/lib/auth';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { AssessmentResultClient } from '@/components/assessments/AssessmentResultClient';
import { analyzeAssessmentHistory } from '@/domain/assessment/engine/AssessmentIntelligenceEngine';

export default async function AssessmentResultPage({ params }: { params: { attemptId: string } }) {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) throw new Error('Profile not found');

  const attempt = await serverRepositories.assessment.getAttempt(params.attemptId);
  if (!attempt || attempt.profileId !== profileId || attempt.status !== 'COMPLETED') {
    throw new Error('Attempt not found or incomplete');
  }

  // Generate Intelligence based on history of this category
  const category = attempt.version.assessment.category;
  const historicalResults = await serverRepositories.assessment.getLatestResultsByCategory(profileId, category);
  const intelligence = analyzeAssessmentHistory(category, historicalResults);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <AssessmentResultClient attempt={attempt} intelligence={intelligence} />
    </div>
  );
}
