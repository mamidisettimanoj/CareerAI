'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { AdminUserService } from '@/domain/admin/service/AdminUserService';
import { AdminCompanyService } from '@/domain/admin/service/AdminCompanyService';
import { AdminInstitutionService } from '@/domain/admin/service/AdminInstitutionService';
import { AdminMembershipService } from '@/domain/admin/service/AdminMembershipService';
import { AdminAuditService } from '@/domain/admin/service/AdminAuditService';
import { AdminMetricsService } from '@/domain/admin/service/AdminMetricsService';
import { Role, AccountStatus, CompanyStatus, InstitutionStatus } from '@prisma/client';

const userService = new AdminUserService(prisma);
const companyService = new AdminCompanyService(prisma);
const institutionService = new AdminInstitutionService(prisma);
const membershipService = new AdminMembershipService(prisma);
const auditService = new AdminAuditService(prisma);
const metricsService = new AdminMetricsService(prisma);

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getAdminMetricsAction() {
  await requireSuperAdmin();
  return metricsService.getPlatformMetrics();
}

// ─── Users ────────────────────────────────────────────────────────────────────

const ListUsersSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  role: z.nativeEnum(Role).optional(),
  accountStatus: z.nativeEnum(AccountStatus).optional(),
});

export async function listUsersAction(input: unknown) {
  await requireSuperAdmin();
  const params = ListUsersSchema.parse(input);
  return userService.listUsers(params.page, params.pageSize, params.search, params.role, params.accountStatus);
}

export async function getUserByIdAction(userId: string) {
  await requireSuperAdmin();
  if (!userId?.trim()) throw new Error('userId is required.');
  return userService.getUserById(userId.trim());
}

const ChangeRoleSchema = z.object({
  targetUserId: z.string().uuid(),
  newRole: z.nativeEnum(Role),
});

export async function changeUserRoleAction(input: unknown) {
  const actor = await requireSuperAdmin();
  const { targetUserId, newRole } = ChangeRoleSchema.parse(input);

  const auditFn = auditService.buildAuditLogger(
    actor.id,
    actor.role,
    'CHANGE_USER_ROLE',
    'User',
    targetUserId,
    { newRole },
  );

  await userService.changeUserRole(actor.id, actor.role, targetUserId, newRole, auditFn);
  revalidatePath('/admin/users');
}

const ChangeStatusSchema = z.object({
  targetUserId: z.string().uuid(),
  newStatus: z.nativeEnum(AccountStatus),
});

export async function changeUserStatusAction(input: unknown) {
  const actor = await requireSuperAdmin();
  const { targetUserId, newStatus } = ChangeStatusSchema.parse(input);

  const auditFn = auditService.buildAuditLogger(
    actor.id,
    actor.role,
    'CHANGE_USER_STATUS',
    'User',
    targetUserId,
    { newStatus },
  );

  await userService.changeUserStatus(actor.id, actor.role, targetUserId, newStatus, auditFn);
  revalidatePath('/admin/users');
}

// ─── Companies ────────────────────────────────────────────────────────────────

const ListCompaniesSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.nativeEnum(CompanyStatus).optional(),
});

export async function listCompaniesAction(input: unknown) {
  await requireSuperAdmin();
  const params = ListCompaniesSchema.parse(input);
  return companyService.listCompanies(params.page, params.pageSize, params.search, params.status);
}

const CreateCompanySchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  website: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  institutionId: z.string().uuid().optional(),
});

export async function createCompanyAction(input: unknown) {
  const actor = await requireSuperAdmin();
  const data = CreateCompanySchema.parse(input);

  const auditFn = auditService.buildAuditLogger(
    actor.id, actor.role, 'CREATE_COMPANY', 'Company', 'new', { name: data.name },
  );

  const result = await companyService.createCompany(data, auditFn);
  revalidatePath('/admin/companies');
  return result;
}

const ChangeCompanyStatusSchema = z.object({
  companyId: z.string().uuid(),
  newStatus: z.nativeEnum(CompanyStatus),
});

export async function changeCompanyStatusAction(input: unknown) {
  const actor = await requireSuperAdmin();
  const { companyId, newStatus } = ChangeCompanyStatusSchema.parse(input);

  const auditFn = auditService.buildAuditLogger(
    actor.id, actor.role, 'CHANGE_COMPANY_STATUS', 'Company', companyId, { newStatus },
  );

  await companyService.changeCompanyStatus(companyId, newStatus, auditFn);
  revalidatePath('/admin/companies');
}

// ─── Institutions ─────────────────────────────────────────────────────────────

const ListInstitutionsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.nativeEnum(InstitutionStatus).optional(),
});

export async function listInstitutionsAction(input: unknown) {
  await requireSuperAdmin();
  const params = ListInstitutionsSchema.parse(input);
  return institutionService.listInstitutions(params.page, params.pageSize, params.search, params.status);
}

const CreateInstitutionSchema = z.object({
  name: z.string().min(1).max(200).trim(),
});

export async function createInstitutionAction(input: unknown) {
  const actor = await requireSuperAdmin();
  const data = CreateInstitutionSchema.parse(input);

  const auditFn = auditService.buildAuditLogger(
    actor.id, actor.role, 'CREATE_INSTITUTION', 'Institution', 'new', { name: data.name },
  );

  const result = await institutionService.createInstitution(data, auditFn);
  revalidatePath('/admin/institutions');
  return result;
}

const ChangeInstitutionStatusSchema = z.object({
  institutionId: z.string().uuid(),
  newStatus: z.nativeEnum(InstitutionStatus),
});

export async function changeInstitutionStatusAction(input: unknown) {
  const actor = await requireSuperAdmin();
  const { institutionId, newStatus } = ChangeInstitutionStatusSchema.parse(input);

  const auditFn = auditService.buildAuditLogger(
    actor.id, actor.role, 'CHANGE_INSTITUTION_STATUS', 'Institution', institutionId, { newStatus },
  );

  await institutionService.changeInstitutionStatus(institutionId, newStatus, auditFn);
  revalidatePath('/admin/institutions');
}

const AssignPlacementAdminSchema = z.object({
  targetUserId: z.string().uuid(),
  institutionId: z.string().uuid(),
});

export async function assignPlacementAdminAction(input: unknown) {
  const actor = await requireSuperAdmin();
  const { targetUserId, institutionId } = AssignPlacementAdminSchema.parse(input);

  const auditFn = auditService.buildAuditLogger(
    actor.id, actor.role, 'ASSIGN_PLACEMENT_ADMIN', 'User', targetUserId, { institutionId },
  );

  await institutionService.assignPlacementAdmin(targetUserId, institutionId, auditFn);
  revalidatePath('/admin/institutions');
}

// ─── Memberships ──────────────────────────────────────────────────────────────

const AssignRecruiterSchema = z.object({
  targetUserId: z.string().uuid(),
  companyId: z.string().uuid(),
  membershipRole: z.string().max(50).default('MEMBER'),
});

export async function assignRecruiterAction(input: unknown) {
  const actor = await requireSuperAdmin();
  const { targetUserId, companyId, membershipRole } = AssignRecruiterSchema.parse(input);

  const auditFn = auditService.buildAuditLogger(
    actor.id, actor.role, 'ASSIGN_RECRUITER', 'RecruiterCompanyMembership', targetUserId,
    { companyId, membershipRole },
  );

  const result = await membershipService.assignRecruiter(targetUserId, companyId, membershipRole, auditFn);
  revalidatePath('/admin/memberships');
  revalidatePath('/admin/companies');
  return result;
}

const RemoveRecruiterSchema = z.object({
  targetUserId: z.string().uuid(),
  companyId: z.string().uuid(),
});

export async function removeRecruiterAction(input: unknown) {
  const actor = await requireSuperAdmin();
  const { targetUserId, companyId } = RemoveRecruiterSchema.parse(input);

  const auditFn = auditService.buildAuditLogger(
    actor.id, actor.role, 'REMOVE_RECRUITER', 'RecruiterCompanyMembership', targetUserId,
    { companyId },
  );

  await membershipService.removeRecruiter(targetUserId, companyId, auditFn);
  revalidatePath('/admin/memberships');
  revalidatePath('/admin/companies');
}

export async function listMembershipsByCompanyAction(companyId: string, page = 1) {
  await requireSuperAdmin();
  if (!companyId?.trim()) throw new Error('companyId is required.');
  return membershipService.listMembershipsByCompany(companyId.trim(), page);
}

export async function listMembershipsByUserAction(userId: string) {
  await requireSuperAdmin();
  if (!userId?.trim()) throw new Error('userId is required.');
  return membershipService.listMembershipsByUser(userId.trim());
}

// ─── Audit ────────────────────────────────────────────────────────────────────

const ListAuditSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
  entityType: z.string().max(100).optional(),
  actorId: z.string().uuid().optional(),
});

export async function listAuditEventsAction(input: unknown) {
  await requireSuperAdmin();
  const params = ListAuditSchema.parse(input);
  return auditService.listEvents(params.page, params.pageSize, params.entityType, params.actorId);
}
