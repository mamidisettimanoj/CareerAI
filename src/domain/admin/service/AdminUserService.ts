import { PrismaClient, Role, AccountStatus } from '@prisma/client';

export interface AdminUserDTO {
  id: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  institutionId: string | null;
  hasProfile: boolean;
  createdAt: Date;
}

export interface AdminUserListResult {
  data: AdminUserDTO[];
  metadata: { page: number; pageSize: number; totalCount: number; hasNext: boolean };
}

export class AdminUserService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Paginated, filtered user list — returns sanitized DTO only.
   * Never returns passwords, tokens, or raw Supabase credentials.
   */
  async listUsers(
    page = 1,
    pageSize = 20,
    search?: string,
    role?: Role,
    accountStatus?: AccountStatus,
  ): Promise<AdminUserListResult> {
    const take = Math.min(pageSize, 100);
    const skip = (page - 1) * take;

    const where: any = {};
    if (role) where.role = role;
    if (accountStatus) where.accountStatus = accountStatus;
    if (search?.trim()) {
      where.email = { contains: search.trim(), mode: 'insensitive' };
    }

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          accountStatus: true,
          institutionId: true,
          createdAt: true,
          profile: { select: { id: true } },
          recruiterMemberships: { select: { companyId: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    const data: AdminUserDTO[] = users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      accountStatus: u.accountStatus,
      institutionId: u.institutionId,
      hasProfile: !!u.profile,
      createdAt: u.createdAt,
    }));

    return { data, metadata: { page, pageSize: take, totalCount, hasNext: skip + take < totalCount } };
  }

  /**
   * Role change with SUPER_ADMIN self-protection.
   * Transactionally changes role and writes an audit event.
   */
  async changeUserRole(
    actorId: string,
    actorRole: Role,
    targetUserId: string,
    newRole: Role,
    auditFn: (tx: any) => Promise<void>,
  ): Promise<void> {
    // Validate role is a known enum value
    if (!Object.values(Role).includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    // Prevent self-demotion of last SUPER_ADMIN
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, accountStatus: true },
    });
    if (!targetUser) throw new Error('Target user not found.');

    if (targetUser.role === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.user.count({
        where: { role: 'SUPER_ADMIN', accountStatus: 'ACTIVE' },
      });
      if (superAdminCount <= 1) {
        throw new Error('Cannot demote the last active SUPER_ADMIN. Assign another SUPER_ADMIN first.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: { role: newRole },
      });
      await auditFn(tx);
    });
  }

  /**
   * Account status management — soft suspension/disable only.
   * SUPER_ADMIN cannot be disabled without replacement protection.
   */
  async changeUserStatus(
    actorId: string,
    actorRole: Role,
    targetUserId: string,
    newStatus: AccountStatus,
    auditFn: (tx: any) => Promise<void>,
  ): Promise<void> {
    if (!Object.values(AccountStatus).includes(newStatus)) {
      throw new Error(`Invalid account status: ${newStatus}`);
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!targetUser) throw new Error('Target user not found.');

    // Protect: cannot suspend/disable the last active SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN' && newStatus !== 'ACTIVE') {
      const activeSuperAdmins = await this.prisma.user.count({
        where: { role: 'SUPER_ADMIN', accountStatus: 'ACTIVE' },
      });
      if (activeSuperAdmins <= 1) {
        throw new Error('Cannot suspend/disable the last active SUPER_ADMIN. Assign another first.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: { accountStatus: newStatus },
      });
      await auditFn(tx);
    });
  }

  /**
   * Get a single user by ID for detailed inspection — DTO only.
   */
  async getUserById(userId: string): Promise<AdminUserDTO & { companyIds: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        institutionId: true,
        createdAt: true,
        profile: { select: { id: true } },
        recruiterMemberships: { select: { companyId: true } },
      },
    });
    if (!user) throw new Error('User not found.');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      institutionId: user.institutionId,
      hasProfile: !!user.profile,
      createdAt: user.createdAt,
      companyIds: user.recruiterMemberships.map(m => m.companyId),
    };
  }
}
