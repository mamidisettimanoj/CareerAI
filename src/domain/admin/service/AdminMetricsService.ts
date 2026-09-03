import { PrismaClient } from '@prisma/client';

export interface AdminPlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  students: number;
  recruiters: number;
  placementAdmins: number;
  superAdmins: number;
  totalCompanies: number;
  activeCompanies: number;
  totalInstitutions: number;
  activeInstitutions: number;
  recruiterMemberships: number;
  publishedJobs: number;
  totalApplications: number;
  candidateApplications: number;
  placementDrives: number;
  recentAuditEvents: number;
}

export class AdminMetricsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Returns real database-backed platform metrics.
   * Uses parallel count queries for performance.
   * Never returns fake or hardcoded numbers.
   */
  async getPlatformMetrics(): Promise<AdminPlatformMetrics> {
    const [
      totalUsers, activeUsers, suspendedUsers,
      students, recruiters, placementAdmins, superAdmins,
      totalCompanies, activeCompanies,
      totalInstitutions, activeInstitutions,
      recruiterMemberships,
      publishedJobs, totalApplications, candidateApplications,
      placementDrives,
      recentAuditEvents,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
      this.prisma.user.count({ where: { accountStatus: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'RECRUITER' } }),
      this.prisma.user.count({ where: { role: 'PLACEMENT_ADMIN' } }),
      this.prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      this.prisma.company.count(),
      this.prisma.company.count({ where: { status: 'ACTIVE' } }),
      this.prisma.institution.count(),
      this.prisma.institution.count({ where: { status: 'ACTIVE' } }),
      this.prisma.recruiterCompanyMembership.count(),
      this.prisma.job.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.application.count(),
      this.prisma.candidateApplication.count(),
      this.prisma.placementDrive.count(),
      this.prisma.adminAuditEvent.count({
        where: { occurredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      totalUsers, activeUsers, suspendedUsers,
      students, recruiters, placementAdmins, superAdmins,
      totalCompanies, activeCompanies,
      totalInstitutions, activeInstitutions,
      recruiterMemberships,
      publishedJobs, totalApplications, candidateApplications,
      placementDrives,
      recentAuditEvents,
    };
  }
}
