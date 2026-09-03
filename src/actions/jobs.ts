'use server';

import { requireCareerUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NullJobProvider } from '@/domain/jobs/providers/NullJobProvider';
import { JobSearchCriteria } from '@/domain/jobs/types/job.types';
import { jobMatchEngine } from '@/domain/jobs/engine/JobMatchEngine';

const prisma = new PrismaClient();
const jobProvider = new NullJobProvider();

export async function searchJobsAction(criteria: JobSearchCriteria) {
  try {
    // 1. Enforce Authentication
    await requireCareerUser();
    
    // 2. Fetch Jobs via Provider Abstract (Fail-closed NullProvider for now)
    const result = await jobProvider.search(criteria);
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Job search action error:', error);
    return { success: false, error: error.message };
  }
}

export async function getJobMatchAction(jobId: string) {
  try {
    // 1. Enforce Authentication & Retrieve Profile ID explicitly
    const user = await requireCareerUser();
    const profileId = user.profile?.id;
    if (!profileId) throw new Error('User profile not found.');

    // 2. Fetch Job Details (Usually from Provider, but we fallback to DB if cached, or return error)
    // Since NullProvider provides no jobs, we return null to UI safely
    const canonicalJob = await jobProvider.getJob(jobId);
    if (!canonicalJob) {
      return { success: false, error: 'JOB_NOT_FOUND' };
    }

    // 3. Fetch Candidate Data for Match Engine
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        skills: true,
        education: true,
        experience: true,
      }
    });

    if (!profile) throw new Error('Profile missing.');

    let experienceMonths = 0;
    profile.experience.forEach(e => {
      experienceMonths += e.durationMonths;
    });

    let highestCgpa: number | undefined = undefined;
    let activeBacklogs = 0;
    
    profile.education.forEach(e => {
      if (e.cgpa) highestCgpa = Math.max(highestCgpa || 0, e.cgpa);
      activeBacklogs += e.activeBacklogs;
    });

    const candidateContext = {
      profile,
      skills: profile.skills,
      academics: {
        cgpa: highestCgpa,
        activeBacklogs
      },
      experienceMonths
    };

    // 4. Calculate Deterministic Match
    const matchResult = jobMatchEngine.calculateMatch(canonicalJob, candidateContext);

    return { 
      success: true, 
      job: canonicalJob, 
      match: matchResult 
    };

  } catch (error: any) {
    console.error('Job match action error:', error);
    return { success: false, error: error.message };
  }
}
