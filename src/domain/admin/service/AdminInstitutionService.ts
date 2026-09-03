import { PrismaClient, InstitutionStatus } from '@prisma/client';

export interface AdminInstitutionDTO {
  id: string;
  name: string;
  status: InstitutionStatus;
  userCount: number;
  driveCount: number;
  createdAt: Date;
}

export class AdminInstitutionService {
  constructor(private readonly prisma: PrismaClient) {}

  async listInstitutions(
    page = 1,
    pageSize = 20,
    search?: string,
    status?: InstitutionStatus,
  ): Promise<{ data: AdminInstitutionDTO[]; metadata: any }> {
    const take = Math.min(pageSize, 100);
    const skip = (page - 1) * take;

    const where: any = {};
    if (status) where.status = status;
    if (search?.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const [institutions, totalCount] = await Promise.all([
      this.prisma.institution.findMany({
        where,
        select: {
          id: true, name: true, status: true, createdAt: true,
          _count: { select: { users: true, placementDrives: true } },
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip, take,
      }),
      this.prisma.institution.count({ where }),
    ]);

    return {
      data: institutions.map(i => ({
        id: i.id, name: i.name, status: i.status, createdAt: i.createdAt,
        userCount: i._count.users, driveCount: i._count.placementDrives,
      })),
      metadata: { page, pageSize: take, totalCount, hasNext: skip + take < totalCount },
    };
  }

  async createInstitution(
    data: { name: string },
    auditFn: (tx: any) => Promise<void>,
  ): Promise<{ id: string }> {
    if (!data.name?.trim()) throw new Error('Institution name is required.');
    if (data.name.length > 200) throw new Error('Institution name exceeds maximum length.');

    const existing = await this.prisma.institution.findFirst({
      where: { name: { equals: data.name.trim(), mode: 'insensitive' } },
    });
    if (existing) throw new Error(`An institution named "${data.name.trim()}" already exists.`);

    return this.prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: { name: data.name.trim(), status: 'ACTIVE' },
      });
      await auditFn(tx);
      return { id: institution.id };
    });
  }

  async changeInstitutionStatus(
    institutionId: string,
    newStatus: InstitutionStatus,
    auditFn: (tx: any) => Promise<void>,
  ): Promise<void> {
    if (!Object.values(InstitutionStatus).includes(newStatus)) {
      throw new Error(`Invalid institution status: ${newStatus}`);
    }
    const inst = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!inst) throw new Error('Institution not found.');
    if (inst.status === newStatus) return; // Idempotent

    await this.prisma.$transaction(async (tx) => {
      await tx.institution.update({ where: { id: institutionId }, data: { status: newStatus } });
      await auditFn(tx);
    });
  }

  /**
   * Assigns a PLACEMENT_ADMIN user to an institution.
   * Only SUPER_ADMIN may perform this operation (enforced in server actions).
   * A user can belong to only one institution at a time via institutionId field.
   */
  async assignPlacementAdmin(
    targetUserId: string,
    institutionId: string,
    auditFn: (tx: any) => Promise<void>,
  ): Promise<void> {
    const [user, institution] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, role: true, institutionId: true } }),
      this.prisma.institution.findUnique({ where: { id: institutionId }, select: { id: true, status: true } }),
    ]);

    if (!user) throw new Error('Target user not found.');
    if (user.role !== 'PLACEMENT_ADMIN') throw new Error('Target user must have PLACEMENT_ADMIN role.');
    if (!institution) throw new Error('Institution not found.');
    if (institution.status !== 'ACTIVE') throw new Error('Cannot assign to an archived institution.');
    if (user.institutionId === institutionId) return; // Idempotent

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: targetUserId }, data: { institutionId } });
      await auditFn(tx);
    });
  }
}
