import { PrismaClient, DriveStatus, Prisma } from '@prisma/client';
import { driveStatusTransitionEngine } from '../engine/TransitionEngines';
import { ConcurrencyConflictError } from '../../applications/types';

export class PlacementDriveService {
  constructor(private readonly prisma: PrismaClient) {}

  async listDrives(institutionId: string, filters: any = {}, pagination = { page: 1, pageSize: 20 }) {
    const where: Prisma.PlacementDriveWhereInput = { institutionId };

    if (filters.status) where.status = filters.status;
    if (filters.companyId) where.companyId = filters.companyId;

    const skip = (pagination.page - 1) * pagination.pageSize;
    const take = Math.min(pagination.pageSize, 100);

    const [data, totalCount] = await Promise.all([
      this.prisma.placementDrive.findMany({
        where,
        include: { company: true },
        orderBy: { date: 'desc' },
        skip,
        take
      }),
      this.prisma.placementDrive.count({ where })
    ]);

    return { data, metadata: { totalCount, page: pagination.page, pageSize: take, hasNext: skip + take < totalCount } };
  }

  async getDrive(institutionId: string, driveId: string) {
    const drive = await this.prisma.placementDrive.findUnique({
      where: { id: driveId, institutionId },
      include: {
        company: true,
        eligibilityRules: { orderBy: { version: 'desc' }, take: 1 }
      }
    });
    if (!drive) throw new Error('Drive not found or unauthorized.');
    return drive;
  }

  async createDrive(institutionId: string, dto: { companyId: string, date: Date, roles: string[] }) {
    // Validate company belongs to institution or is global
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) throw new Error('Company not found.');
    if (company.institutionId && company.institutionId !== institutionId) {
      throw new Error('Company not authorized for this institution.');
    }

    return this.prisma.placementDrive.create({
      data: {
        institutionId,
        companyId: dto.companyId,
        date: dto.date,
        roles: dto.roles,
        status: DriveStatus.DRAFT
      }
    });
  }

  async changeStatus(institutionId: string, driveId: string, newStatus: DriveStatus, expectedVersion: number) {
    return this.prisma.$transaction(async (tx) => {
      const drive = await tx.placementDrive.findUnique({ where: { id: driveId, institutionId } });
      if (!drive) throw new Error('Drive not found or unauthorized.');

      const transition = driveStatusTransitionEngine.validate(drive.status, newStatus);
      if (!transition.valid) throw new Error(transition.reason);

      const { count } = await tx.placementDrive.updateMany({
        where: { id: driveId, institutionId, version: expectedVersion },
        data: { status: newStatus, version: expectedVersion + 1 }
      });

      if (count === 0) throw new ConcurrencyConflictError();

      return tx.placementDrive.findUnique({ where: { id: driveId } });
    });
  }

  async updateEligibilityRule(institutionId: string, driveId: string, ruleData: {
    minCgpa?: number | null;
    maxActiveBacklogs?: number | null;
    graduationYears?: number[];
    allowedBranches?: string[];
    requiredSkills?: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const drive = await tx.placementDrive.findUnique({ 
        where: { id: driveId, institutionId },
        include: { eligibilityRules: { orderBy: { version: 'desc' }, take: 1 } }
      });
      
      if (!drive) throw new Error('Drive not found or unauthorized.');
      
      const currentRule = drive.eligibilityRules[0];
      const nextVersion = currentRule ? currentRule.version + 1 : 1;

      return tx.driveEligibilityRule.create({
        data: {
          placementDriveId: driveId,
          version: nextVersion,
          minCgpa: ruleData.minCgpa ?? null,
          maxActiveBacklogs: ruleData.maxActiveBacklogs ?? null,
          graduationYears: ruleData.graduationYears ?? [],
          allowedBranches: ruleData.allowedBranches ?? [],
          requiredSkills: ruleData.requiredSkills ?? []
        }
      });
    });
  }
}
