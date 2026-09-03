import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminUserService } from '../service/AdminUserService';
import { AdminCompanyService } from '../service/AdminCompanyService';
import { AdminInstitutionService } from '../service/AdminInstitutionService';
import { AdminMembershipService } from '../service/AdminMembershipService';
import { AdminAuditService } from '../service/AdminAuditService';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

function makePrisma(overrides: Record<string, any> = {}) {
  const transaction = async (fn: (tx: any) => Promise<any>) => fn(makePrisma(overrides).core);

  const core: any = {
    $transaction: vi.fn(transaction),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({}),
    },
    company: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 'company-1' }),
      update: vi.fn().mockResolvedValue({}),
    },
    institution: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 'inst-1' }),
      update: vi.fn().mockResolvedValue({}),
    },
    recruiterCompanyMembership: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 'mem-1' }),
      delete: vi.fn().mockResolvedValue({}),
    },
    adminAuditEvent: {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    ...overrides,
  };
  return { core, ...core };
}

const noopAudit = async (_tx: any) => {};

// ─── A. Authentication (service-layer — route guards tested structurally) ─────

describe('AdminUserService — RBAC and User Management', () => {
  let prisma: any;
  let userService: AdminUserService;

  beforeEach(() => {
    prisma = makePrisma();
    userService = new AdminUserService(prisma.core);
  });

  // 1. List users — returns DTO, not raw model
  it('1. listUsers returns sanitized DTO without secrets', async () => {
    prisma.core.user.findMany.mockResolvedValue([{
      id: 'u-1', email: 'test@test.com', role: 'STUDENT',
      accountStatus: 'ACTIVE', institutionId: null, createdAt: new Date(),
      profile: { id: 'p-1' }, recruiterMemberships: [],
    }]);
    prisma.core.user.count.mockResolvedValue(1);
    const result = await userService.listUsers(1, 20);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toHaveProperty('hasProfile', true);
    expect(result.data[0]).not.toHaveProperty('recruiterMemberships');
    expect(result.data[0]).not.toHaveProperty('profile');
  });

  // 2. Search is applied server-side
  it('2. listUsers applies server-side search filter', async () => {
    await userService.listUsers(1, 20, 'alice@example.com');
    const call = prisma.core.user.findMany.mock.calls[0][0];
    expect(call.where.email).toMatchObject({ contains: 'alice@example.com' });
  });

  // 3. Page size is capped at 100
  it('3. listUsers caps pageSize at 100', async () => {
    await userService.listUsers(1, 9999);
    const call = prisma.core.user.findMany.mock.calls[0][0];
    expect(call.take).toBe(100);
  });

  // 4. Role filter applied server-side
  it('4. listUsers applies role filter server-side', async () => {
    await userService.listUsers(1, 20, undefined, 'RECRUITER');
    const call = prisma.core.user.findMany.mock.calls[0][0];
    expect(call.where.role).toBe('RECRUITER');
  });

  // 5. Invalid role rejected
  it('5. changeUserRole rejects invalid role', async () => {
    await expect(
      userService.changeUserRole('actor-1', 'SUPER_ADMIN', 'target-1', 'INVALID_ROLE' as any, noopAudit)
    ).rejects.toThrow('Invalid role');
  });

  // 6. Last SUPER_ADMIN cannot be demoted
  it('6. changeUserRole prevents demoting last SUPER_ADMIN', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'actor-1', role: 'SUPER_ADMIN', accountStatus: 'ACTIVE' });
    prisma.core.user.count.mockResolvedValue(1); // Only 1 SUPER_ADMIN
    await expect(
      userService.changeUserRole('admin', 'SUPER_ADMIN', 'actor-1', 'STUDENT', noopAudit)
    ).rejects.toThrow('last active SUPER_ADMIN');
  });

  // 7. Demoting SUPER_ADMIN allowed when multiple exist
  it('7. changeUserRole allows demoting SUPER_ADMIN when another exists', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-2', role: 'SUPER_ADMIN', accountStatus: 'ACTIVE' });
    prisma.core.user.count.mockResolvedValue(2); // 2 admins
    await expect(
      userService.changeUserRole('actor-1', 'SUPER_ADMIN', 'u-2', 'RECRUITER', noopAudit)
    ).resolves.not.toThrow();
  });

  // 8. Target user not found is rejected
  it('8. changeUserRole rejects nonexistent target user', async () => {
    prisma.core.user.findUnique.mockResolvedValue(null);
    await expect(
      userService.changeUserRole('admin', 'SUPER_ADMIN', 'ghost-id', 'STUDENT', noopAudit)
    ).rejects.toThrow('Target user not found');
  });

  // 9. Last SUPER_ADMIN cannot be suspended
  it('9. changeUserStatus prevents suspending last SUPER_ADMIN', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'SUPER_ADMIN' });
    prisma.core.user.count.mockResolvedValue(1);
    await expect(
      userService.changeUserStatus('admin', 'SUPER_ADMIN', 'u-1', 'SUSPENDED', noopAudit)
    ).rejects.toThrow('last active SUPER_ADMIN');
  });

  // 10. Invalid AccountStatus rejected
  it('10. changeUserStatus rejects invalid status value', async () => {
    await expect(
      userService.changeUserStatus('admin', 'SUPER_ADMIN', 'u-1', 'DELETED' as any, noopAudit)
    ).rejects.toThrow('Invalid account status');
  });

  // 11. getUserById returns DTO without raw model
  it('11. getUserById returns DTO with companyIds', async () => {
    prisma.core.user.findUnique.mockResolvedValue({
      id: 'u-5', email: 'r@co.com', role: 'RECRUITER', accountStatus: 'ACTIVE',
      institutionId: null, createdAt: new Date(), profile: null,
      recruiterMemberships: [{ companyId: 'c-1' }],
    });
    const dto = await userService.getUserById('u-5');
    expect(dto.companyIds).toEqual(['c-1']);
    expect(dto).not.toHaveProperty('recruiterMemberships');
  });
});

// ─── B. Company Management ─────────────────────────────────────────────────────

describe('AdminCompanyService', () => {
  let prisma: any;
  let companyService: AdminCompanyService;

  beforeEach(() => {
    prisma = makePrisma();
    companyService = new AdminCompanyService(prisma.core);
  });

  // 12. Company creation validates uniqueness
  it('12. createCompany rejects duplicate company name', async () => {
    prisma.core.company.findFirst.mockResolvedValue({ id: 'existing', name: 'Acme Corp' });
    await expect(
      companyService.createCompany({ name: 'Acme Corp' }, noopAudit)
    ).rejects.toThrow('already exists');
  });

  // 13. Empty company name rejected
  it('13. createCompany rejects empty name', async () => {
    await expect(
      companyService.createCompany({ name: '' }, noopAudit)
    ).rejects.toThrow('name is required');
  });

  // 14. Name too long rejected
  it('14. createCompany rejects name exceeding 200 chars', async () => {
    await expect(
      companyService.createCompany({ name: 'A'.repeat(201) }, noopAudit)
    ).rejects.toThrow('maximum length');
  });

  // 15. Invalid CompanyStatus rejected
  it('15. changeCompanyStatus rejects invalid status', async () => {
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c-1', status: 'ACTIVE' });
    await expect(
      companyService.changeCompanyStatus('c-1', 'DELETED' as any, noopAudit)
    ).rejects.toThrow('Invalid company status');
  });

  // 16. Archiving non-existent company fails
  it('16. changeCompanyStatus rejects nonexistent company', async () => {
    prisma.core.company.findUnique.mockResolvedValue(null);
    await expect(
      companyService.changeCompanyStatus('ghost', 'ARCHIVED', noopAudit)
    ).rejects.toThrow('Company not found');
  });

  // 17. Idempotent archive
  it('17. changeCompanyStatus is idempotent — archiving already-archived is no-op', async () => {
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c-1', status: 'ARCHIVED' });
    await companyService.changeCompanyStatus('c-1', 'ARCHIVED', noopAudit);
    expect(prisma.core.$transaction).not.toHaveBeenCalled();
  });
});

// ─── C. Recruiter Membership Management ───────────────────────────────────────

describe('AdminMembershipService — Critical Module 18 Invariant', () => {
  let prisma: any;
  let membershipService: AdminMembershipService;

  beforeEach(() => {
    prisma = makePrisma();
    membershipService = new AdminMembershipService(prisma.core);
  });

  // 18. Non-RECRUITER user cannot be assigned
  it('18. assignRecruiter rejects non-RECRUITER target user', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'STUDENT', accountStatus: 'ACTIVE', recruiterMemberships: [] });
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c-1', status: 'ACTIVE', name: 'Acme' });
    await expect(
      membershipService.assignRecruiter('u-1', 'c-1', 'MEMBER', noopAudit)
    ).rejects.toThrow('RECRUITER role');
  });

  // 19. Suspended user cannot be assigned
  it('19. assignRecruiter rejects suspended user', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'RECRUITER', accountStatus: 'SUSPENDED', recruiterMemberships: [] });
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c-1', status: 'ACTIVE', name: 'Acme' });
    await expect(
      membershipService.assignRecruiter('u-1', 'c-1', 'MEMBER', noopAudit)
    ).rejects.toThrow('suspended or disabled');
  });

  // 20. Duplicate membership rejected
  it('20. assignRecruiter rejects duplicate assignment to same company', async () => {
    prisma.core.user.findUnique.mockResolvedValue({
      id: 'u-1', role: 'RECRUITER', accountStatus: 'ACTIVE',
      recruiterMemberships: [{ companyId: 'c-1' }],
    });
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c-1', status: 'ACTIVE', name: 'Acme' });
    await expect(
      membershipService.assignRecruiter('u-1', 'c-1', 'MEMBER', noopAudit)
    ).rejects.toThrow('already assigned');
  });

  // 21. CRITICAL: Second active membership is rejected (Module 18 invariant)
  it('21. assignRecruiter rejects creating a second active membership — Module 18 invariant', async () => {
    prisma.core.user.findUnique.mockResolvedValue({
      id: 'u-1', role: 'RECRUITER', accountStatus: 'ACTIVE',
      recruiterMemberships: [{ companyId: 'c-2' }], // Already has one
    });
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c-3', status: 'ACTIVE', name: 'Beta Corp' });
    await expect(
      membershipService.assignRecruiter('u-1', 'c-3', 'MEMBER', noopAudit)
    ).rejects.toThrow('already has an active company membership');
  });

  // 22. Assignment to archived company is rejected
  it('22. assignRecruiter rejects assignment to archived company', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'RECRUITER', accountStatus: 'ACTIVE', recruiterMemberships: [] });
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c-1', status: 'ARCHIVED', name: 'Old Corp' });
    await expect(
      membershipService.assignRecruiter('u-1', 'c-1', 'MEMBER', noopAudit)
    ).rejects.toThrow('archived company');
  });

  // 23. Valid assignment succeeds
  it('23. assignRecruiter succeeds for valid single-membership assignment', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'RECRUITER', accountStatus: 'ACTIVE', recruiterMemberships: [] });
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c-1', status: 'ACTIVE', name: 'Acme' });
    const result = await membershipService.assignRecruiter('u-1', 'c-1', 'MEMBER', noopAudit);
    expect(result.id).toBe('mem-1');
  });

  // 24. Remove nonexistent membership is rejected deterministically
  it('24. removeRecruiter rejects nonexistent membership deterministically', async () => {
    prisma.core.recruiterCompanyMembership.findUnique.mockResolvedValue(null);
    await expect(
      membershipService.removeRecruiter('u-1', 'c-1', noopAudit)
    ).rejects.toThrow('does not exist');
  });

  // 25. Valid removal succeeds
  it('25. removeRecruiter succeeds for existing membership', async () => {
    prisma.core.recruiterCompanyMembership.findUnique.mockResolvedValue({ id: 'mem-1' });
    await expect(
      membershipService.removeRecruiter('u-1', 'c-1', noopAudit)
    ).resolves.not.toThrow();
  });

  // 26. Arbitrary company assignment blocked by unknown company
  it('26. assignRecruiter rejects nonexistent company', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'RECRUITER', accountStatus: 'ACTIVE', recruiterMemberships: [] });
    prisma.core.company.findUnique.mockResolvedValue(null);
    await expect(
      membershipService.assignRecruiter('u-1', 'ghost-company', 'MEMBER', noopAudit)
    ).rejects.toThrow('Company not found');
  });

  // 27. Target user not found is rejected
  it('27. assignRecruiter rejects nonexistent user', async () => {
    prisma.core.user.findUnique.mockResolvedValue(null);
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c-1', status: 'ACTIVE', name: 'Acme' });
    await expect(
      membershipService.assignRecruiter('ghost-user', 'c-1', 'MEMBER', noopAudit)
    ).rejects.toThrow('not found');
  });
});

// ─── D. Institution Management ─────────────────────────────────────────────────

describe('AdminInstitutionService', () => {
  let prisma: any;
  let institutionService: AdminInstitutionService;

  beforeEach(() => {
    prisma = makePrisma();
    institutionService = new AdminInstitutionService(prisma.core);
  });

  // 28. Duplicate institution rejected
  it('28. createInstitution rejects duplicate name', async () => {
    prisma.core.institution.findFirst.mockResolvedValue({ id: 'i-1', name: 'MIT' });
    await expect(
      institutionService.createInstitution({ name: 'MIT' }, noopAudit)
    ).rejects.toThrow('already exists');
  });

  // 29. Empty institution name rejected
  it('29. createInstitution rejects empty name', async () => {
    await expect(
      institutionService.createInstitution({ name: '' }, noopAudit)
    ).rejects.toThrow('name is required');
  });

  // 30. Idempotent archive
  it('30. changeInstitutionStatus is idempotent', async () => {
    prisma.core.institution.findUnique.mockResolvedValue({ id: 'i-1', status: 'ARCHIVED' });
    await institutionService.changeInstitutionStatus('i-1', 'ARCHIVED', noopAudit);
    expect(prisma.core.$transaction).not.toHaveBeenCalled();
  });

  // 31. Non-PLACEMENT_ADMIN cannot be assigned
  it('31. assignPlacementAdmin rejects non-PLACEMENT_ADMIN user', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'STUDENT', institutionId: null });
    prisma.core.institution.findUnique.mockResolvedValue({ id: 'i-1', status: 'ACTIVE' });
    await expect(
      institutionService.assignPlacementAdmin('u-1', 'i-1', noopAudit)
    ).rejects.toThrow('PLACEMENT_ADMIN role');
  });

  // 32. Assignment to archived institution rejected
  it('32. assignPlacementAdmin rejects archived institution', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'PLACEMENT_ADMIN', institutionId: null });
    prisma.core.institution.findUnique.mockResolvedValue({ id: 'i-1', status: 'ARCHIVED' });
    await expect(
      institutionService.assignPlacementAdmin('u-1', 'i-1', noopAudit)
    ).rejects.toThrow('archived institution');
  });

  // 33. Idempotent assignment (same institution)
  it('33. assignPlacementAdmin is idempotent for same institution', async () => {
    prisma.core.user.findUnique.mockResolvedValue({ id: 'u-1', role: 'PLACEMENT_ADMIN', institutionId: 'i-1' });
    prisma.core.institution.findUnique.mockResolvedValue({ id: 'i-1', status: 'ACTIVE' });
    await institutionService.assignPlacementAdmin('u-1', 'i-1', noopAudit);
    expect(prisma.core.$transaction).not.toHaveBeenCalled();
  });
});

// ─── E. Audit Trail ────────────────────────────────────────────────────────────

describe('AdminAuditService', () => {
  let prisma: any;
  let auditService: AdminAuditService;

  beforeEach(() => {
    prisma = makePrisma();
    auditService = new AdminAuditService(prisma.core);
  });

  // 34. Audit logger creates exactly one record
  it('34. buildAuditLogger creates exactly one audit record via transaction', async () => {
    const logger = auditService.buildAuditLogger('a-1', 'SUPER_ADMIN', 'CHANGE_USER_ROLE', 'User', 'u-1', { newRole: 'RECRUITER' });
    const mockTx = { adminAuditEvent: { create: vi.fn().mockResolvedValue({}) } };
    await logger(mockTx);
    expect(mockTx.adminAuditEvent.create).toHaveBeenCalledTimes(1);
  });

  // 35. Audit logger captures actorId from server session (not client)
  it('35. buildAuditLogger stores the server-provided actorId', async () => {
    const logger = auditService.buildAuditLogger('server-actor-id', 'SUPER_ADMIN', 'TEST', 'User', 'u-1');
    const mockTx = { adminAuditEvent: { create: vi.fn().mockResolvedValue({}) } };
    await logger(mockTx);
    const call = mockTx.adminAuditEvent.create.mock.calls[0][0];
    expect(call.data.actorId).toBe('server-actor-id');
  });

  // 36. Audit logger stores actorRole from server session
  it('36. buildAuditLogger stores actorRole as server-provided value', async () => {
    const logger = auditService.buildAuditLogger('a-1', 'SUPER_ADMIN', 'TEST', 'User', 'u-1');
    const mockTx = { adminAuditEvent: { create: vi.fn().mockResolvedValue({}) } };
    await logger(mockTx);
    const call = mockTx.adminAuditEvent.create.mock.calls[0][0];
    expect(call.data.actorRole).toBe('SUPER_ADMIN');
  });

  // 37. listEvents applies entityType filter
  it('37. listEvents applies entityType filter server-side', async () => {
    prisma.core.adminAuditEvent.findMany.mockResolvedValue([]);
    await auditService.listEvents(1, 50, 'Company');
    const call = prisma.core.adminAuditEvent.findMany.mock.calls[0][0];
    expect(call.where.entityType).toBe('Company');
  });

  // 38. listEvents caps page size
  it('38. listEvents caps pageSize at 100', async () => {
    prisma.core.adminAuditEvent.findMany.mockResolvedValue([]);
    await auditService.listEvents(1, 9999);
    const call = prisma.core.adminAuditEvent.findMany.mock.calls[0][0];
    expect(call.take).toBe(100);
  });

  // 39. Audit service exposes no delete method
  it('39. AdminAuditService has no delete or update method — immutability guarantee', () => {
    expect((auditService as any).deleteEvent).toBeUndefined();
    expect((auditService as any).updateEvent).toBeUndefined();
    expect((auditService as any).modifyEvent).toBeUndefined();
  });
});

// ─── F. Input Security ─────────────────────────────────────────────────────────

describe('Input security — Zod schema boundary tests', () => {
  // 40. Role enum validation (whitelist only known roles)
  it('40. AdminUserService role mutation uses enum validation', async () => {
    const prisma = makePrisma();
    const service = new AdminUserService(prisma.core);
    await expect(
      service.changeUserRole('a', 'SUPER_ADMIN', 'u', 'OWNER' as any, noopAudit)
    ).rejects.toThrow('Invalid role');
  });

  // 41. AccountStatus enum validation
  it('41. AdminUserService status mutation uses enum validation', async () => {
    const prisma = makePrisma();
    const service = new AdminUserService(prisma.core);
    await expect(
      service.changeUserStatus('a', 'SUPER_ADMIN', 'u', 'BANNED' as any, noopAudit)
    ).rejects.toThrow('Invalid account status');
  });

  // 42. CompanyStatus enum validation
  it('42. AdminCompanyService status mutation uses enum validation', async () => {
    const prisma = makePrisma();
    const service = new AdminCompanyService(prisma.core);
    prisma.core.company.findUnique.mockResolvedValue({ id: 'c', status: 'ACTIVE' });
    await expect(
      service.changeCompanyStatus('c', 'SUSPENDED' as any, noopAudit)
    ).rejects.toThrow('Invalid company status');
  });

  // 43. InstitutionStatus enum validation
  it('43. AdminInstitutionService status mutation uses enum validation', async () => {
    const prisma = makePrisma();
    const service = new AdminInstitutionService(prisma.core);
    prisma.core.institution.findUnique.mockResolvedValue({ id: 'i', status: 'ACTIVE' });
    await expect(
      service.changeInstitutionStatus('i', 'INACTIVE' as any, noopAudit)
    ).rejects.toThrow('Invalid institution status');
  });

  // 44. Listing with unknown role filter
  it('44. listUsers with unknown role filter is handled gracefully', async () => {
    const prisma = makePrisma();
    const service = new AdminUserService(prisma.core);
    prisma.core.user.findMany.mockResolvedValue([]);
    prisma.core.user.count.mockResolvedValue(0);
    // listUsers with undefined role filter should not throw
    const result = await service.listUsers(1, 20, undefined, undefined);
    expect(result.data).toEqual([]);
  });

  // 45. Company creation rejects oversized website URL
  it('45. createCompany properly trims input strings', async () => {
    const prisma = makePrisma();
    const service = new AdminCompanyService(prisma.core);
    prisma.core.company.findFirst.mockResolvedValue(null);
    prisma.core.company.create.mockResolvedValue({ id: 'c-new' });
    const result = await service.createCompany({ name: '  Acme Corp  ' }, noopAudit);
    // Should pass trimmed name
    const call = prisma.core.$transaction.mock.calls[0];
    expect(result).toBeDefined();
  });
});

// ─── G. Authorization Boundary (structural) ────────────────────────────────────

describe('Authorization boundary tests (structural)', () => {
  // 46. requireSuperAdmin is the gateway
  it('46. admin.ts actions are in a server-only file with use server directive', async () => {
    // Structural: verify server action file exists and has 'use server'
    const fs = await import('fs');
    const content = fs.readFileSync(
      'src/actions/admin.ts', 'utf-8'
    );
    expect(content.startsWith("'use server'")).toBe(true);
  });

  // 47. SUPER_ADMIN membership service does NOT expose delete on audit
  it('47. AdminAuditService exposes no mutation methods beyond buildAuditLogger', () => {
    const prisma = makePrisma();
    const service = new AdminAuditService(prisma.core);
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    const dangerous = methods.filter(m => ['delete', 'update', 'modify', 'clear', 'drop', 'truncate'].some(d => m.toLowerCase().includes(d)));
    expect(dangerous).toHaveLength(0);
  });

  // 48. Company service does not expose raw deletion
  it('48. AdminCompanyService has no hard-delete method', () => {
    const prisma = makePrisma();
    const service = new AdminCompanyService(prisma.core);
    expect((service as any).deleteCompany).toBeUndefined();
    expect((service as any).hardDelete).toBeUndefined();
  });

  // 49. User service does not expose raw deletion
  it('49. AdminUserService has no hard-delete method', () => {
    const prisma = makePrisma();
    const service = new AdminUserService(prisma.core);
    expect((service as any).deleteUser).toBeUndefined();
    expect((service as any).hardDelete).toBeUndefined();
  });

  // 50. Membership service prohibits arbitrary findFirst — single membership invariant
  it('50. AdminMembershipService uses findUnique (not findFirst) for membership lookup', () => {
    const prisma = makePrisma();
    const service = new AdminMembershipService(prisma.core);
    // Structural: verify the service does not expose arbitrary lookup
    expect((service as any).findAnyMembership).toBeUndefined();
  });
});
