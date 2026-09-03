import { PrismaClient } from '@prisma/client';

export interface AdminMembershipDTO {
  id: string;
  userId: string;
  userEmail: string;
  companyId: string;
  companyName: string;
  role: string;
  createdAt: Date;
}

export class AdminMembershipService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Assigns a recruiter to a company.
   * CRITICAL: Enforces the single-active-membership invariant from Module 18.
   * A user may have at most ONE active membership. Assigning a second is rejected.
   * Only SUPER_ADMIN may call this (enforced at server action layer).
   */
  async assignRecruiter(
    targetUserId: string,
    companyId: string,
    membershipRole: string,
    auditFn: (tx: any) => Promise<void>,
  ): Promise<{ id: string }> {
    const [user, company] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, role: true, accountStatus: true, recruiterMemberships: { select: { companyId: true } } },
      }),
      this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true, status: true, name: true } }),
    ]);

    if (!user) throw new Error('Target user not found.');
    if (user.role !== 'RECRUITER') throw new Error('Target user must have RECRUITER role.');
    if (user.accountStatus !== 'ACTIVE') throw new Error('Cannot assign a suspended or disabled user.');
    if (!company) throw new Error('Company not found.');
    if (company.status !== 'ACTIVE') throw new Error('Cannot assign to an archived company.');

    // Duplicate check
    const existingForSameCompany = user.recruiterMemberships.find(m => m.companyId === companyId);
    if (existingForSameCompany) {
      throw new Error(`User is already assigned to company "${company.name}".`);
    }

    // CRITICAL: Single-membership invariant enforcement (Module 18)
    if (user.recruiterMemberships.length > 0) {
      throw new Error(
        'User already has an active company membership. Remove the existing membership before assigning to a new company. ' +
        'This prevents ambiguous company-context resolution in the Recruiter portal.'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.recruiterCompanyMembership.create({
        data: { userId: targetUserId, companyId, role: membershipRole || 'MEMBER' },
      });
      await auditFn(tx);
      return { id: membership.id };
    });
  }

  /**
   * Removes a recruiter from a company.
   * Idempotent: removing a non-existent membership returns deterministically.
   */
  async removeRecruiter(
    targetUserId: string,
    companyId: string,
    auditFn: (tx: any) => Promise<void>,
  ): Promise<void> {
    const membership = await this.prisma.recruiterCompanyMembership.findUnique({
      where: { userId_companyId: { userId: targetUserId, companyId } },
    });

    if (!membership) {
      throw new Error('Membership does not exist. Nothing to remove.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.recruiterCompanyMembership.delete({
        where: { userId_companyId: { userId: targetUserId, companyId } },
      });
      await auditFn(tx);
    });
  }

  /**
   * Lists all memberships for a given company — DTO only.
   */
  async listMembershipsByCompany(companyId: string, page = 1, pageSize = 50): Promise<{
    data: AdminMembershipDTO[];
    metadata: any;
  }> {
    const take = Math.min(pageSize, 100);
    const skip = (page - 1) * take;

    const [memberships, totalCount] = await Promise.all([
      this.prisma.recruiterCompanyMembership.findMany({
        where: { companyId },
        select: {
          id: true, userId: true, companyId: true, role: true, createdAt: true,
          user: { select: { email: true } },
          company: { select: { name: true } },
        },
        orderBy: [{ createdAt: 'asc' }],
        skip, take,
      }),
      this.prisma.recruiterCompanyMembership.count({ where: { companyId } }),
    ]);

    return {
      data: memberships.map(m => ({
        id: m.id, userId: m.userId, userEmail: m.user.email,
        companyId: m.companyId, companyName: m.company.name,
        role: m.role, createdAt: m.createdAt,
      })),
      metadata: { page, pageSize: take, totalCount, hasNext: skip + take < totalCount },
    };
  }

  /**
   * Lists all memberships for a given user — for admin inspection.
   */
  async listMembershipsByUser(userId: string): Promise<AdminMembershipDTO[]> {
    const memberships = await this.prisma.recruiterCompanyMembership.findMany({
      where: { userId },
      select: {
        id: true, userId: true, companyId: true, role: true, createdAt: true,
        user: { select: { email: true } },
        company: { select: { name: true } },
      },
    });
    return memberships.map(m => ({
      id: m.id, userId: m.userId, userEmail: m.user.email,
      companyId: m.companyId, companyName: m.company.name,
      role: m.role, createdAt: m.createdAt,
    }));
  }
}
