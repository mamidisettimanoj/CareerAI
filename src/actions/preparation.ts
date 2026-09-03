'use server';

import { requireCareerUser } from '@/lib/auth';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { generatePreparationPlan } from '@/domain/preparation/engine/PreparationPlanEngine';
import { PreparationPlanInput, RoadmapDef } from '@/domain/preparation/types/preparation.types';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function generatePreparationPlanAction(): Promise<void> {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) throw new Error('Profile not found');

  const profile = await serverRepositories.profile.getProfile();
  if (!profile) throw new Error('Profile details missing');

  // Load verified intelligence context
  const resume = await serverRepositories.resume.getLatestResume(profileId);
  const assessments = await serverRepositories.assessment.getLatestResults(profileId);
  const skills = await serverRepositories.skills.getSkills();
  const projects = await serverRepositories.project.getProjects();
  const currentRoadmap = await serverRepositories.preparation.getCurrentRoadmap(profileId);
  
  // Transform assessment obj to Record<string, number> representing percentage
  const assessmentInput: Record<string, number> = {};
  for (const [key, val] of Object.entries(assessments)) {
    assessmentInput[key] = val.percentage;
  }

  const input: PreparationPlanInput = {
    targetRole: profile.targetRole || undefined,
    readinessScore: 0, 
    skills: skills.map(s => ({ name: s.name, proficiency: s.proficiencyScore, required: true })), 
    projects: projects.map(p => ({ id: p.id, name: p.name })),
    resume: { hasResume: !!resume, score: resume?.qualityScore || undefined },
    assessments: assessmentInput,
    academics: { cgpa: profile.degree.cgpa, activeBacklogs: profile.degree.backlogs },
    availabilityHoursPerWeek: 10,
    existingTasks: currentRoadmap?.tasks || []
  };

  const generatedTasks = generatePreparationPlan(input);

  const newRoadmap: RoadmapDef = {
    id: uuidv4(),
    profileId,
    version: (currentRoadmap?.version || 0) + 1,
    targetRole: profile.targetRole || undefined,
    status: 'ACTIVE',
    generatedAt: new Date(),
    sourceVersionMetadata: { engine: '1.0' },
    tasks: generatedTasks
  };

  await serverRepositories.preparation.saveRoadmap(newRoadmap);
  revalidatePath('/preparation');
  revalidatePath('/dashboard');
}

export async function updatePreparationTaskStatusAction(taskId: string, status: string): Promise<void> {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) throw new Error('Profile not found');

  await serverRepositories.preparation.updateTaskStatus(taskId, profileId, status);
  revalidatePath('/preparation');
}
