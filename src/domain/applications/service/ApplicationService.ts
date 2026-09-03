import { PrismaClient, ApplicationStatus, Prisma } from '@prisma/client';
import { applicationTransitionEngine } from '../engine/ApplicationStatusTransitionEngine';
import { NotificationService } from '../../notification/service/NotificationService';
import { CreateApplicationDto, DashboardMetrics, ApplicationFilters, PaginationParams, PaginatedResult, ConcurrencyConflictError } from '../types';

export class ApplicationService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves an application by ID, strictly scoping to profileId to prevent IDOR.
   */
  async getApplication(profileId: string, applicationId: string) {
    return this.prisma.application.findUnique({
      where: {
        id: applicationId,
        profileId,
      },
      include: {
        events: {
          orderBy: { occurredAt: 'desc' }
        }
      }
    });
  }

  /**
   * Retrieves paginated applications scoped to profileId.
   */
  async listApplications(
    profileId: string,
    filters: ApplicationFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.ApplicationWhereInput = {
      profileId,
      archivedAt: filters.archived ? { not: null } : null
    };

    if (filters.status && filters.status.length > 0) where.status = { in: filters.status };
    if (filters.source && filters.source.length > 0) where.source = { in: filters.source };
    if (filters.companyName) where.companySnapshot = { contains: filters.companyName, mode: 'insensitive' };
    if (filters.location) where.locationSnapshot = { contains: filters.location, mode: 'insensitive' };
    
    if (filters.dateFrom || filters.dateTo) {
      where.appliedAt = {};
      if (filters.dateFrom) where.appliedAt.gte = filters.dateFrom;
      if (filters.dateTo) where.appliedAt.lte = filters.dateTo;
    }

    const skip = (pagination.page - 1) * pagination.pageSize;
    const take = Math.min(pagination.pageSize, 100); // hard cap

    const [data, totalCount] = await Promise.all([
      this.prisma.application.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take
      }),
      this.prisma.application.count({ where })
    ]);

    return {
      data,
      metadata: {
        page: pagination.page,
        pageSize: take,
        totalCount,
        hasNext: skip + take < totalCount
      }
    };
  }

  /**
   * Transactional creation of an application + initial event
   */
  async createApplication(profileId: string, dto: CreateApplicationDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Check for basic duplication (prevent blind spamming)
      if (dto.jobId) {
        const existing = await tx.application.findFirst({
          where: { 
            profileId, 
            jobId: dto.jobId,
            status: { notIn: [ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN] }
          }
        });
        if (existing) throw new Error('Duplicate application for this job is already active.');
      } else {
        const existing = await tx.application.findFirst({
          where: {
            profileId,
            companySnapshot: dto.companySnapshot,
            jobTitleSnapshot: dto.jobTitleSnapshot,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // within 30 days
          }
        });
        if (existing) throw new Error('Similar manual application tracked recently. Please verify.');
      }

      // 2. Create Application
      const application = await tx.application.create({
        data: {
          profileId,
          jobId: dto.jobId,
          source: dto.source,
          sourceDescription: dto.sourceDescription,
          companySnapshot: dto.companySnapshot,
          jobTitleSnapshot: dto.jobTitleSnapshot,
          locationSnapshot: dto.locationSnapshot,
          sourceUrlSnapshot: dto.sourceUrlSnapshot,
          employmentTypeSnapshot: dto.employmentTypeSnapshot,
          remoteTypeSnapshot: dto.remoteTypeSnapshot,
          salarySnapshot: dto.salarySnapshot,
          status: ApplicationStatus.APPLIED,
          appliedAt: new Date(),
          notes: dto.notes,
          events: {
            create: {
              newStatus: ApplicationStatus.APPLIED,
              note: 'Application tracked manually.'
            }
          }
        },
        include: { events: true }
      });

      return application;
    });
  }

  /**
   * Creates an application from a CareerAI Job. Server fetches Job directly!
   */
  async createFromJob(profileId: string, jobId: string) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id: jobId } });
      if (!job) throw new Error('Job not found.');

      const existing = await tx.application.findFirst({
        where: { profileId, jobId, status: { notIn: [ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN] } }
      });
      if (existing) throw new Error('Duplicate application for this job is already active.');

      const application = await tx.application.create({
        data: {
          profileId,
          jobId,
          source: 'CAREERAI_JOB',
          companySnapshot: job.companyName,
          jobTitleSnapshot: job.title,
          locationSnapshot: job.location,
          sourceUrlSnapshot: job.sourceUrl,
          employmentTypeSnapshot: job.employmentType,
          remoteTypeSnapshot: job.remoteType,
          status: ApplicationStatus.APPLIED,
          appliedAt: new Date(),
          events: {
            create: {
              newStatus: ApplicationStatus.APPLIED,
              note: 'Application tracked from CareerAI Job Listing.'
            }
          }
        },
        include: { events: true }
      });

      return application;
    });
  }

  /**
   * Transactional state change with optimistic concurrency control
   */
  async changeStatus(profileId: string, applicationId: string, newStatus: ApplicationStatus, expectedVersion: number, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch & authorize
      const application = await tx.application.findUnique({
        where: { id: applicationId, profileId }
      });

      if (!application) throw new Error('Application not found or unauthorized.');

      // 2. Validate Transition
      const transition = applicationTransitionEngine.validateTransition(application.status, newStatus);
      if (!transition.valid) throw new Error(transition.reason);

      // 3. Mutate atomically using updateMany for optimistic lock check
      const { count } = await tx.application.updateMany({
        where: { id: applicationId, version: expectedVersion },
        data: {
          status: newStatus,
          version: expectedVersion + 1
        }
      });

      if (count === 0) throw new ConcurrencyConflictError();

      // 4. Append Event explicitly
      await tx.applicationEvent.create({
        data: {
          applicationId,
          previousStatus: application.status,
          newStatus,
          note
        }
      });

      // 5. Notify the student
      const notificationService = new NotificationService(this.prisma);
      await notificationService.createNotification({
        recipientUserId: profileId, // profileId maps directly to userId
        type: 'APPLICATION_STATUS_CHANGED',
        title: 'Application Status Updated',
        message: `Your application status has been updated to ${newStatus}.`,
        relatedEntityType: 'APPLICATION',
        relatedEntityId: applicationId,
      }, tx);

      return tx.application.findUnique({ 
        where: { id: applicationId }, 
        include: { events: { orderBy: { occurredAt: 'desc' } } } 
      });
    });
  }

  /**
   * Append a note securely
   */
  async addPrivateNote(profileId: string, applicationId: string, expectedVersion: number, note: string) {
    if (!note || note.trim().length === 0) throw new Error('Note cannot be empty.');
    if (note.length > 2000) throw new Error('Note exceeds maximum length.');
    if (note.includes('<script>') || note.match(/javascript:/i)) throw new Error('Invalid input detected.');

    return this.prisma.$transaction(async (tx) => {
      const application = await tx.application.findUnique({ where: { id: applicationId, profileId } });
      if (!application) throw new Error('Application not found or unauthorized.');

      const { count } = await tx.application.updateMany({
        where: { id: applicationId, version: expectedVersion },
        data: { version: expectedVersion + 1 }
      });
      if (count === 0) throw new ConcurrencyConflictError();

      await tx.applicationEvent.create({
        data: {
          applicationId,
          newStatus: application.status,
          note
        }
      });

      return tx.application.findUnique({ where: { id: applicationId }, include: { events: { orderBy: { occurredAt: 'desc' } } } });
    });
  }

  /**
   * Soft archive
   */
  async archiveApplication(profileId: string, applicationId: string, expectedVersion: number) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.application.updateMany({
        where: { id: applicationId, profileId, version: expectedVersion },
        data: {
          archivedAt: new Date(),
          version: expectedVersion + 1
        }
      });
      if (count === 0) throw new ConcurrencyConflictError();
      return tx.application.findUnique({ where: { id: applicationId } });
    });
  }

  /**
   * Calculates dashboard metrics
   */
  async getDashboardMetrics(profileId: string): Promise<DashboardMetrics> {
    const applications = await this.prisma.application.findMany({
      where: { profileId, archivedAt: null },
      include: { events: true }
    });

    const totalApplications = applications.length;
    let activeApplications = 0;
    let interviews = 0;
    let offers = 0;
    let accepted = 0;
    let rejected = 0;

    const inactiveStatuses: ApplicationStatus[] = [ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN, ApplicationStatus.SAVED];

    for (const app of applications) {
      if (!inactiveStatuses.includes(app.status)) {
        activeApplications++;
      }
      
      if (app.status === ApplicationStatus.REJECTED) rejected++;
      if (app.status === ApplicationStatus.ACCEPTED) accepted++;

      // Evaluate historical events for accurate metric counting
      const hasInterviewed = app.events.some(e => e.newStatus === ApplicationStatus.INTERVIEW);
      const hasOffer = app.events.some(e => e.newStatus === ApplicationStatus.OFFER || e.newStatus === ApplicationStatus.ACCEPTED);

      if (hasInterviewed) interviews++;
      if (hasOffer) offers++;
    }

    const eligibleForInterviewRate = totalApplications; // or exclude SAVED? Let's say all APPLIED and beyond
    const eligibleForOfferRate = interviews;

    return {
      totalApplications,
      activeApplications,
      interviews,
      offers,
      accepted,
      rejected,
      interviewRate: eligibleForInterviewRate >= 5 ? (interviews / eligibleForInterviewRate) * 100 : null,
      offerRate: eligibleForOfferRate >= 1 ? (offers / eligibleForOfferRate) * 100 : null
    };
  }
}
