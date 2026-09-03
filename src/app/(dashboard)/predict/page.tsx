import { PredictForm } from '@/components/predict/PredictForm';
import { requireUser } from '@/lib/auth';
import { serverRepositories } from '@/services/ServerServiceLocator';

export default async function Predict() {
  await requireUser();
  const initialProfile = await serverRepositories.profile.getProfile();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">Placement Prediction Engine</h1>
        <p className="text-sm md:text-base text-muted-foreground">Complete your profile to get a comprehensive career readiness estimate.</p>
      </div>

      <PredictForm initialProfile={initialProfile} />
    </div>
  );
}
