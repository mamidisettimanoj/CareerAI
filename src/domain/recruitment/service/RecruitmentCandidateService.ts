import { PrismaClient, RecruitmentStage } from '@prisma/client';
import { NotificationService } from '../../notification/service/NotificationService';

export class RecruitmentCandidateService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Paginated candidate applications scoped strictly to companyId via job relation.
   * No global student search — every query begins with job.companyId.
   */
  async listCandidates(companyId: string, filters: {
    jobId?: string;
    stage?: string;
    appliedAfter?: Date;
    appliedBefore?: Date;
  }, page = 1, pageSize = 20) {
    const take = Math.min(pageSize, 100);
    const skip = (page - 1) * take;

    const where: any = { job: { companyId } }; // STRICT Isolation boundary
    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.stage) where.status = filters.stage as RecruitmentStage;
    if (filters.appliedAfter || filters.appliedBefore) {
      where.appliedAt = {};
      if (filters.appliedAfter) where.appliedAt.gte = filters.appliedAfter;
      if (filters.appliedBefore) where.appliedAt.lte = filters.appliedBefore;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.candidateApplication.findMany({
        where,
        include: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
              education: { orderBy: { endYear: 'desc' }, take: 1, select: { degreeType: true, branch: true, endYear: true } },
              skills: { orderBy: { proficiency: 'desc' }, take: 5, select: { name: true } }
            }
          },
          job: { select: { id: true, title: true } }
        },
        orderBy: [{ appliedAt: 'desc' }, { id: 'asc' }],
        skip, take
      }),
      this.prisma.candidateApplication.count({ where })
    ]);

    // Explicit DTO — never return raw Prisma profile/user objects.
    const dtos = data.map(app => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job.title,
      candidateName: `${app.profile.firstName} ${app.profile.lastName}`,
      stage: app.status,
      appliedAt: app.appliedAt,
      latestEducation: app.profile.education[0]
        ? `${app.profile.education[0].degreeType} in ${app.profile.education[0].branch || 'General'}`
        : null,
      graduationYear: app.profile.education[0]?.endYear ?? null,
      topSkills: app.profile.skills.map(s => s.name),
      resumeProvided: !!app.resumeId
    }));

    return { data: dtos, metadata: { page, pageSize: take, totalCount, hasNext: skip + take < totalCount } };
  }

  /**
   * Detailed candidate view — scoped to companyId through nested job relation.
   * Returns strict DTO — no Application Tracker notes, no Copilot, no auth data.
   */
  async getCandidateDetail(companyId: string, applicationId: string) {
    const app = await this.prisma.candidateApplication.findUnique({
      where: { id: applicationId, job: { companyId } },
      include: {
        profile: {
          select: {
            id: true, firstName: true, lastName: true,
            education: true,
            experience: { select: { id: true, company: true, role: true, isInternship: true, durationMonths: true } },
            skills: { select: { id: true, name: true, category: true, proficiency: true } },
            projects: { select: { id: true, name: true, description: true, technologies: true, githubUrl: true } }
          }
        },
        job: { select: { id: true, title: true, status: true } },
        events: { orderBy: { occurredAt: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' } },
        resume: { select: { id: true, status: true, completeness: true } }
      }
    });

    if (!app) throw new Error('Candidate application not found or unauthorized.');

    return {
      id: app.id,
      stage: app.status,
      appliedAt: app.appliedAt,
      version: app.version,
      job: { id: app.job.id, title: app.job.title },
      candidate: {
        id: app.profile.id,
        firstName: app.profile.firstName,
        lastName: app.profile.lastName,
        education: app.profile.education,
        experience: app.profile.experience,
        skills: app.profile.skills,
        projects: app.profile.projects
      },
      resume: app.resume ? { id: app.resume.id, status: app.resume.status, completeness: app.resume.completeness } : null,
      notes: app.notes.map(n => ({ id: n.id, content: n.content, createdAt: n.createdAt })),
      history: app.events.map(e => ({ id: e.id, previousStage: e.previousStage, newStage: e.newStage, note: e.note, occurredAt: e.occurredAt }))
    };
  }

  /**
   * Adds a private recruiter note — scoped to company through application → job → company.
   * actorId is always server-derived from the authenticated session.
   */
  async addNote(companyId: string, actorId: string, applicationId: string, content: string) {
    if (!content?.trim()) throw new Error('Note content cannot be empty.');
    if (content.length > 5000) throw new Error('Note exceeds maximum length of 5000 characters.');

    const app = await this.prisma.candidateApplication.findUnique({
      where: { id: applicationId, job: { companyId } }
    });
    if (!app) throw new Error('Candidate application not found or unauthorized.');

    return this.prisma.recruiterNote.create({
      data: { applicationId, actorId, content: content.trim() }
    });
  }

  /**
   * Creates a CandidateApplication when a student applies to a recruiter's published job.
   * This is the only authorized creation path. Recruiter cannot create applications for arbitrary students.
   * profileId comes from the authenticated student's session — not from client payload.
   */
  async applyToJob(profileId: string, jobId: string, resumeId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        select: { id: true, title: true, companyId: true, status: true }
      });
      if (!job || job.status !== 'PUBLISHED') throw new Error('Job is not available for application.');

      const existing = await tx.candidateApplication.findUnique({ where: { jobId_profileId: { jobId, profileId } } });
      if (existing) throw new Error('You have already applied to this job.');

      if (resumeId) {
        const resume = await tx.resume.findUnique({ where: { id: resumeId, profileId } });
        if (!resume) throw new Error('Resume not found or unauthorized.');
      }

      const application = await tx.candidateApplication.create({
        data: { jobId, profileId, resumeId, status: 'RECEIVED' }
      });

      await tx.recruitmentEvent.create({
        data: { applicationId: application.id, actorId: profileId, newStage: 'RECEIVED', note: 'Application submitted.' }
      });

      // 5. Notify all active recruiters of the company, if applicable
      if (job.companyId) {
        const memberships = await tx.recruiterCompanyMembership.findMany({
          where: { companyId: job.companyId },
          select: { userId: true }
        });

        const notificationService = new NotificationService(this.prisma);
        for (const membership of memberships) {
          await notificationService.createNotification({
            recipientUserId: membership.userId,
            type: 'NEW_CANDIDATE_APPLICATION',
            title: 'New Candidate Application',
            message: `A new candidate has applied to ${job.title}.`,
            relatedEntityType: 'CANDIDATE_APPLICATION',
            relatedEntityId: application.id,
          }, tx);
        }
      }

      return application;
    });
  }

  /**
   * Generates an authorized, short-lived signed URL for resume access.
   * Validates: application belongs to company, resume belongs to application.
   * Fails closed if Supabase is unavailable.
   */
  async getAuthorizedResumeUrl(companyId: string, applicationId: string): Promise<string> {
    const app = await this.prisma.candidateApplication.findUnique({
      where: { id: applicationId, job: { companyId } },
      include: { resume: { select: { id: true, fileUrl: true } } }
    });

    if (!app) throw new Error('Application not found or unauthorized.');
    if (!app.resume) throw new Error('No resume is attached to this application.');

    const storageKey = app.resume.fileUrl;
    if (!storageKey) throw new Error('Resume storage reference is missing.');

    // Attempt to generate Supabase signed URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Resume download is temporarily unavailable. Storage service is not configured.');
    }

    // Dynamically import Supabase client to create signed URL
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await adminClient.storage
      .from('resumes')
      .createSignedUrl(storageKey, 300); // 5-minute expiry

    if (error || !data?.signedUrl) {
      throw new Error('Failed to generate secure resume access. Please try again.');
    }

    return data.signedUrl;
  }
}
