import { getAssessmentAttemptAction } from '@/actions/assessment';
import { requireCareerUser } from '@/lib/auth';
import { TakeAssessmentClient } from '@/components/assessments/TakeAssessmentClient';

export default async function TakeAssessmentPage({ params }: { params: { id: string } }) {
  await requireCareerUser();
  const attemptId = params.id;
  
  const attempt = await getAssessmentAttemptAction(attemptId);

  return (
    <div className="max-w-4xl mx-auto py-6">
      <TakeAssessmentClient attempt={attempt} />
    </div>
  );
}
