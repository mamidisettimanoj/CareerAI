import { PrismaClient, RecruitmentStage } from '@prisma/client';
import { ConcurrencyConflictError } from '../../applications/types';
import { NotificationService } from '../../notification/service/NotificationService';

export class RecruitmentLifecycleService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Defines legal transitions for recruiter stages.
   */
  private readonly validTransitions: Record<RecruitmentStage, RecruitmentStage[]> = {
    RECEIVED: ['REVIEWING', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
    REVIEWING: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
    SHORTLISTED: ['ASSESSMENT', 'INTERVIEW', 'REJECTED', 'WITHDRAWN'],
    ASSESSMENT: ['INTERVIEW', 'REJECTED', 'WITHDRAWN'],
    INTERVIEW: ['OFFER', 'REJECTED', 'WITHDRAWN'],
    OFFER: ['HIRED', 'REJECTED', 'WITHDRAWN'],
    HIRED: [], // Terminal
    REJECTED: [], // Terminal
    WITHDRAWN: [] // Terminal
  };

  /**
   * Deterministically transitions a candidate's stage, verifying optimistic locking and appending an audit event.
   */
  async changeStage(
    companyId: string, 
    actorId: string, 
    applicationId: string, 
    newStage: RecruitmentStage, 
    expectedVersion: number,
    note?: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate existence and tenant scope
      const application = await tx.candidateApplication.findUnique({
        where: { id: applicationId, job: { companyId } }
      });

      if (!application) throw new Error('Application not found or unauthorized.');

      // 2. Validate transition
      const allowed = this.validTransitions[application.status]?.includes(newStage);
      if (!allowed) {
        throw new Error(`Invalid stage transition from ${application.status} to ${newStage}`);
      }

      // 3. Update with optimistic locking
      const { count } = await tx.candidateApplication.updateMany({
        where: { id: applicationId, version: expectedVersion },
        data: {
          status: newStage,
          version: expectedVersion + 1
        }
      });

      if (count === 0) throw new ConcurrencyConflictError();

      // 4. Append Immutable Event
      await tx.recruitmentEvent.create({
        data: {
          applicationId,
          actorId,
          previousStage: application.status,
          newStage,
          note
        }
      });

      // 5. Notify the candidate
      const notificationService = new NotificationService(this.prisma);
      await notificationService.createNotification({
        recipientUserId: application.profileId, // profileId maps to userId in this architecture
        type: 'CANDIDATE_STAGE_CHANGED',
        title: 'Application Update',
        message: `Your application has moved to ${newStage}.`,
        relatedEntityType: 'CANDIDATE_APPLICATION',
        relatedEntityId: application.id,
      }, tx);

      return tx.candidateApplication.findUnique({
        where: { id: applicationId },
        include: { events: { orderBy: { occurredAt: 'desc' } } }
      });
    });
  }
}
