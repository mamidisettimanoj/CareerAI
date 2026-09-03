import { PrismaClient, JobStatus } from '@prisma/client';

export class RecruiterJobService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Legal transitions map — exhaustive and explicit. */
  private readonly allowedTransitions: Record<JobStatus, JobStatus[]> = {
    [JobStatus.DRAFT]:     [JobStatus.PUBLISHED],
    [JobStatus.PUBLISHED]: [JobStatus.CLOSED],
    [JobStatus.CLOSED]:    [JobStatus.ARCHIVED],
    [JobStatus.ARCHIVED]:  [],
  };

  /** Paginated jobs scoped strictly to companyId. */
  async listJobs(companyId: string, page = 1, pageSize = 20) {
    const take = Math.min(pageSize, 100);
    const skip = (page - 1) * take;
    const [data, totalCount] = await Promise.all([
      this.prisma.job.findMany({
        where: { companyId },
        orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
        skip, take
      }),
      this.prisma.job.count({ where: { companyId } })
    ]);
    return { data, metadata: { page, pageSize: take, totalCount, hasNext: skip + take < totalCount } };
  }

  /** Get a single job scoped to companyId. */
  async getJob(companyId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId, companyId } });
    if (!job) throw new Error('Job not found or unauthorized.');
    return job;
  }

  /**
   * Creates a DRAFT job. companyId is ALWAYS server-derived — never from client.
   */
  async createJob(companyId: string, data: {
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
    if (!data.title?.trim()) throw new Error('Job title is required.');
    if (!data.description?.trim()) throw new Error('Job description is required.');
    if (data.title.length > 200) throw new Error('Job title exceeds maximum length.');
    if (data.description.length > 20000) throw new Error('Job description exceeds maximum length.');

    return this.prisma.job.create({
      data: {
        companyId,
        source: 'INTERNAL',
        title: data.title.trim(),
        description: data.description.trim(),
        location: data.location?.trim(),
        requiredSkills: data.requiredSkills ?? [],
        preferredSkills: data.preferredSkills ?? [],
        employmentType: data.employmentType,
        remoteType: data.remoteType,
        experienceMin: data.experienceMin,
        experienceMax: data.experienceMax,
        status: JobStatus.DRAFT,
        isActive: false,
      }
    });
  }

  /** Updates a DRAFT job — editing is only allowed in DRAFT state. */
  async updateJob(companyId: string, jobId: string, data: {
    title?: string;
    description?: string;
    location?: string;
    requiredSkills?: string[];
    preferredSkills?: string[];
    employmentType?: string;
    remoteType?: string;
  }) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId, companyId } });
    if (!job) throw new Error('Job not found or unauthorized.');
    if (job.status !== JobStatus.DRAFT) throw new Error('Only DRAFT jobs can be edited.');

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.description && { description: data.description.trim() }),
        ...(data.location !== undefined && { location: data.location?.trim() }),
        ...(data.requiredSkills !== undefined && { requiredSkills: data.requiredSkills }),
        ...(data.preferredSkills !== undefined && { preferredSkills: data.preferredSkills }),
        ...(data.employmentType !== undefined && { employmentType: data.employmentType }),
        ...(data.remoteType !== undefined && { remoteType: data.remoteType }),
      }
    });
  }

  /**
   * Deterministic lifecycle transition.
   * DRAFT → PUBLISHED → CLOSED → ARCHIVED
   * All other paths are explicitly rejected.
   */
  async changeStatus(companyId: string, jobId: string, newStatus: JobStatus) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id: jobId, companyId } });
      if (!job) throw new Error('Job not found or unauthorized.');

      const allowed = this.allowedTransitions[job.status]?.includes(newStatus);
      if (!allowed) {
        throw new Error(`Invalid job lifecycle transition: ${job.status} → ${newStatus}`);
      }

      return tx.job.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          publishedAt: newStatus === JobStatus.PUBLISHED && !job.publishedAt ? new Date() : job.publishedAt,
          isActive: newStatus === JobStatus.PUBLISHED,
        }
      });
    });
  }
}
