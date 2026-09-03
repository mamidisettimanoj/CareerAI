import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

/**
 * Returns the currently authenticated Supabase user.
 */
export async function getSession() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

/**
 * Returns the authenticated user, or redirects to login if unauthenticated.
 */
export async function requireUser() {
  const user = await getSession()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Returns the full CareerAI database user including role, or redirects if unauthorized.
 * Also enforces AccountStatus: SUSPENDED and DISABLED users are denied access.
 */
export async function requireCareerUser() {
  const user = await requireUser()
  const careerUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true }
  })

  if (!careerUser) {
    // Edge case where auth user exists but DB provisioning failed
    redirect('/login')
  }

  // Fail closed on suspended or disabled accounts
  if (careerUser.accountStatus === 'SUSPENDED' || careerUser.accountStatus === 'DISABLED') {
    redirect('/login')
  }

  return careerUser
}

/**
 * Verifies the user has a specific role, throwing or redirecting otherwise.
 */
export async function requireRole(allowedRoles: Role[]) {
  const user = await requireCareerUser()
  if (!allowedRoles.includes(user.role)) {
    redirect('/dashboard') // Redirect unauthorized to home
  }
  return user
}

/**
 * Convenience for requiring STUDENT role
 */
export async function requireStudent() {
  return requireRole(['STUDENT'])
}

/**
 * Convenience for requiring PLACEMENT_ADMIN role and verifying they belong to an institution.
 */
export async function requirePlacementAdmin() {
  const user = await requireRole(['PLACEMENT_ADMIN']);
  if (!user.institutionId) {
    throw new Error('Placement Admin is not assigned to an institution.');
  }
  return { ...user, institutionId: user.institutionId };
}

/**
 * Convenience for requiring RECRUITER role and verifying they belong to a company.
 * Strictly resolves company scope to prevent unauthorized access.
 */
export async function requireRecruiter() {
  const user = await requireRole(['RECRUITER']);
  const careerUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { recruiterMemberships: true }
  });

  const memberships = careerUser?.recruiterMemberships || [];
  
  if (memberships.length === 0) {
    throw new Error('Recruiter is not assigned to an authorized company.');
  }
  
  if (memberships.length > 1) {
    throw new Error('Multiple active recruiter memberships found. Explicit company selection is required but not yet implemented. Failing closed.');
  }

  const membership = memberships[0];
  if (!membership || !membership.companyId) {
    throw new Error('Recruiter is not assigned to an authorized company.');
  }
  
  return { ...user, companyId: membership.companyId, membershipRole: membership.role };
}

/**
 * Convenience for requiring SUPER_ADMIN role
 */
export async function requireSuperAdmin() {
  return requireRole(['SUPER_ADMIN'])
}
