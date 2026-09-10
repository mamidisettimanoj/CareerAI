"use client";

import { useState, useEffect } from 'react';
import { PredictForm } from '@/components/predict/PredictForm';
import { repositories } from '@/services/ServiceLocator';
import { UserProfile } from '@/types';

export default function Predict() {
  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const profile = await repositories.profile.getProfile();
      setInitialProfile(profile);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">Placement Prediction Engine</h1>
        <p className="text-sm md:text-base text-muted-foreground">Complete your profile to get a comprehensive career readiness estimate.</p>
      </div>

      <PredictForm initialProfile={initialProfile} />
    </div>
  );
}
