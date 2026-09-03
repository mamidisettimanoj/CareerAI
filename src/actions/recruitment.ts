'use server';

import { prisma } from '@/lib/prisma';
import { requireRecruiter, requireStudent } from '@/lib/auth';
import { RecruiterJobService, RecruitmentCandidateService, RecruitmentLifecycleService } from '@/domain/recruitment';
import { JobStatus, RecruitmentStage } from '@prisma/client';

// ─── RECRUITER ACTIONS ─────────────────────────────────────────────────────

/** List jobs scoped to the recruiter's authorized company. */
export async function getRecruiterJobsAction(page = 1, pageSize = 20) {
  const { companyId } = await requireRecruiter();
  return new RecruiterJobService(prisma).listJobs(companyId, page, pageSize);
}

/** Get a single job scoped to recruiter's company. */
export async function getRecruiterJobAction(jobId: string) {
  const { companyId } = await requireRecruiter();
  return new RecruiterJobService(prisma).getJob(companyId, jobId);
}

/** Create a new job. companyId resolved server-side; client cannot supply it. */
export async function createRecruiterJobAction(data: {
  title: string;
  description: string;
  location?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  employmentType?: string;
  remoteType?: string;
  experienceMin?: number;
  experienceMax?: number;
}) {
  const { companyId } = await requireRecruiter();
  return new RecruiterJobService(prisma).createJob(companyId, data);
}

/** Update a DRAFT job. */
export async function updateRecruiterJobAction(jobId: string, data: {
  title?: string;
  description?: string;
  location?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  employmentType?: string;
  remoteType?: string;
}) {
  const { companyId } = await requireRecruiter();
  return new RecruiterJobService(prisma).updateJob(companyId, jobId, data);
}

/** Change job lifecycle status. */
export async function changeJobStatusAction(jobId: string, status: JobStatus) {
  const { companyId } = await requireRecruiter();
  return new RecruiterJobService(prisma).changeStatus(companyId, jobId, status);
}

/** List candidates for the recruiter's company — with filtering and pagination. */
export async function getRecruiterCandidatesAction(
  page = 1,
  filters: { jobId?: string; stage?: string; appliedAfter?: Date; appliedBefore?: Date } = {}
) {
  const { companyId } = await requireRecruiter();
  return new RecruitmentCandidateService(prisma).listCandidates(companyId, filters, page, 20);
}

/** Get full candidate detail — recruiter DTO only. */
export async function getCandidateDetailAction(applicationId: string) {
  const { companyId } = await requireRecruiter();
  return new RecruitmentCandidateService(prisma).getCandidateDetail(companyId, applicationId);
}

/** Add a recruiter note — actorId is always server-derived. */
export async function addRecruiterNoteAction(applicationId: string, content: string) {
  const { id: actorId, companyId } = await requireRecruiter();
  return new RecruitmentCandidateService(prisma).addNote(companyId, actorId, applicationId, content);
}

/** Change candidate recruitment stage with optimistic locking. */
export async function changeRecruitmentStageAction(
  applicationId: string,
  newStage: RecruitmentStage,
  expectedVersion: number,
  note?: string
) {
  const { id: actorId, companyId } = await requireRecruiter();
  return new RecruitmentLifecycleService(prisma).changeStage(companyId, actorId, applicationId, newStage, expectedVersion, note);
}

/** Get authorized, short-lived signed URL for resume. Fails closed if Supabase unavailable. */
export async function getResumeSignedUrlAction(applicationId: string): Promise<{ url: string } | { error: string }> {
  try {
    const { companyId } = await requireRecruiter();
    const url = await new RecruitmentCandidateService(prisma).getAuthorizedResumeUrl(companyId, applicationId);
    return { url };
  } catch (err: any) {
    // Return a safe error message — never expose internals
    return { error: err?.message ?? 'Resume access is currently unavailable.' };
  }
}

// ─── STUDENT APPLICATION ACTION ──────────────────────────────────────────────

/** Student applies to a published job. profileId comes from authenticated session, not client. */
export async function applyToJobAction(jobId: string, resumeId?: string) {
  const user = await requireStudent();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!profile) throw new Error('Profile not found.');
  return new RecruitmentCandidateService(prisma).applyToJob(profile.id, jobId, resumeId);
}
