import { ResumeAnalyzer } from '@/components/resume/ResumeAnalyzer';

import { requireCareerUser } from '@/lib/auth';
import { serverRepositories } from '@/services/ServerServiceLocator';

export default async function Resume() {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  const latestResume = profileId ? await serverRepositories.resume.getLatestResume(profileId) : null;

  return <ResumeAnalyzer initialResume={latestResume as any} />;
}


