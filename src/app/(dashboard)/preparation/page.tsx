import { requireCareerUser } from '@/lib/auth';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { RoadmapClient } from '@/components/preparation/RoadmapClient';

export default async function PreparationPage() {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) throw new Error('Profile not found');

  // Load the current deterministic roadmap
  const roadmap = await serverRepositories.preparation.getCurrentRoadmap(profileId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold">Preparation Intelligence</h1>
        <p className="text-muted-foreground mt-2">
          Your adaptive 7/30/90 day preparation plan, deterministically generated from your actual Career Intelligence gaps.
        </p>
      </div>

      <RoadmapClient roadmap={roadmap} />
    </div>
  );
}
