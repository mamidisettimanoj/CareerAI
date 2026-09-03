import { getAssessmentsAction } from '@/actions/assessment';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { requireCareerUser } from '@/lib/auth';
import { AssessmentsClient } from '@/components/assessments/AssessmentsClient';

export default async function AssessmentsPage() {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) throw new Error('Profile not found');

  // Fetch all available assessment templates (with latest version info)
  const availableAssessments = await getAssessmentsAction();

  // Fetch user's latest results to show completion status
  const latestResults = await serverRepositories.assessment.getLatestResults(profileId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold">Assessment Intelligence</h1>
        <p className="text-muted-foreground">Take authoritative assessments to deterministically evaluate your readiness.</p>
      </div>

      <AssessmentsClient 
        availableAssessments={availableAssessments} 
        latestResults={latestResults} 
      />
    </div>
  );
}
