import { PrismaClient, Role } from '@prisma/client';

export interface AdminAuditEventDTO {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
}

export class AdminAuditService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Returns a transaction-compatible function for appending an audit event.
   * Must be called within a Prisma transaction to ensure atomicity with the mutation.
   * Actor identity must always come from the authenticated session — never from client payload.
   */
  buildAuditLogger(
    actorId: string,
    actorRole: Role,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ) {
    return async (tx: any) => {
      // Audit log is append-only. No update or delete path exists.
      await tx.adminAuditEvent.create({
        data: {
          actorId,
          actorRole,
          action,
          entityType,
          entityId,
          metadata: metadata ?? null,
        },
      });
    };
  }

  /**
   * Paginated read of audit events — read-only view, no mutation paths.
   */
  async listEvents(
    page = 1,
    pageSize = 50,
    entityType?: string,
    actorId?: string,
  ): Promise<{ data: AdminAuditEventDTO[]; metadata: any }> {
    const take = Math.min(pageSize, 100);
    const skip = (page - 1) * take;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (actorId) where.actorId = actorId;

    const [events, totalCount] = await Promise.all([
      this.prisma.adminAuditEvent.findMany({
        where,
        select: {
          id: true,
          actorId: true,
          actorRole: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          occurredAt: true,
          actor: { select: { email: true } },
        },
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.prisma.adminAuditEvent.count({ where }),
    ]);

    return {
      data: events.map(e => ({
        id: e.id,
        actorId: e.actorId,
        actorEmail: e.actor.email,
        actorRole: e.actorRole,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        metadata: e.metadata as Record<string, unknown> | null,
        occurredAt: e.occurredAt,
      })),
      metadata: { page, pageSize: take, totalCount, hasNext: skip + take < totalCount },
    };
  }
}
