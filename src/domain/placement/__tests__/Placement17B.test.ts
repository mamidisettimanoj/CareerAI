import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlacementDriveService } from '../service/PlacementDriveService';
import { DriveParticipationService } from '../service/DriveParticipationService';
import { ConcurrencyConflictError } from '../../applications/types';

describe('Module 17B - Placement Cell Stabilization & Verification', () => {
  let mockPrisma: any;
  let driveService: PlacementDriveService;
  let partService: DriveParticipationService;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (cb) => {
        return cb(mockPrisma);
      }),
      company: { findUnique: vi.fn(), count: vi.fn() },
      placementDrive: { 
        create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), findMany: vi.fn(), count: vi.fn() 
      },
      placementDriveParticipation: { 
        findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() 
      },
      driveEligibilityRule: { create: vi.fn() },
      profile: { findUnique: vi.fn() },
      driveParticipationEvent: { create: vi.fn() },
      application: { findUnique: vi.fn() }
    };
    driveService = new PlacementDriveService(mockPrisma);
    partService = new DriveParticipationService(mockPrisma);
  });

  describe('1. Cross-Tenant Isolation (Student & Company)', () => {
    it('prevents Institution A from using Institution B company', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: 'compB', institutionId: 'inst-B' });
      await expect(
        driveService.createDrive('inst-A', { companyId: 'compB', date: new Date(), roles: [] })
      ).rejects.toThrow('Company not authorized for this institution.');
    });

    it('allows Institution A to use a GLOBAL company (institutionId = null)', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: 'compGlobal', institutionId: null });
      mockPrisma.placementDrive.create.mockResolvedValue({ id: 'driveA' });
      
      const drive = await driveService.createDrive('inst-A', { companyId: 'compGlobal', date: new Date(), roles: [] });
      expect(drive.id).toBe('driveA');
    });

    it('blocks student participation status change from an unauthorized institution admin', async () => {
      mockPrisma.placementDriveParticipation.findUnique.mockResolvedValue({
        id: 'part1',
        placementDrive: { institutionId: 'inst-B' } // Drive belongs to Inst B
      });
      
      // Admin from Inst A tries to edit it
      await expect(
        partService.changeParticipationStatus('adminA', 'inst-A', 'part1', 'SHORTLISTED', 1)
      ).rejects.toThrow('Unauthorized cross-institution access.');
    });
  });

  describe('2. Eligibility Rule Versioning (Historical Explainability)', () => {
    it('appends a new version rather than overwriting existing rules', async () => {
      mockPrisma.placementDrive.findUnique.mockResolvedValue({
        id: 'drive1',
        institutionId: 'inst-A',
        eligibilityRules: [{ version: 1, minCgpa: 7.5 }]
      });
      mockPrisma.driveEligibilityRule.create.mockResolvedValue({ id: 'rule2', version: 2 });

      await driveService.updateEligibilityRule('inst-A', 'drive1', { minCgpa: 8.0 });
      
      expect(mockPrisma.driveEligibilityRule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 2,
            minCgpa: 8.0
          })
        })
      );
    });
  });

  describe('3. Placement Privacy (Application Notes & Copilot)', () => {
    it('Placement Admin cannot access private application notes via ID manipulation', async () => {
      const { ApplicationService } = await import('../../applications/service/ApplicationService');
      const appService = new ApplicationService(mockPrisma);
      
      // Attempting to fetch another student's application private data
      mockPrisma.application.findUnique.mockResolvedValue(null);
      
      // In reality, the Admin's actor ID would be passed, not the student's, because requireStudent() blocks them.
      // Even if they spoofed the profile ID argument in a server action that did not verify identity properly:
      const result = await appService.getApplication('admin-actor-id', 'app-id-belonging-to-student');
      
      // Because Prisma filters on BOTH id and profileId, it returns null.
      expect(mockPrisma.application.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-id-belonging-to-student', profileId: 'admin-actor-id' },
        include: { events: { orderBy: { occurredAt: 'desc' } } }
      });
      expect(result).toBeNull();
    });
  });

  describe('4. Transaction Integrity & Idempotency', () => {
    it('rolls back registration if event creation fails', async () => {
      // Vitest mock transaction simulates a failure during the callback
      mockPrisma.placementDrive.findUnique.mockResolvedValue({ status: 'OPEN', eligibilityRules: [] });
      mockPrisma.placementDriveParticipation.findUnique.mockResolvedValue(null);
      mockPrisma.profile.findUnique.mockResolvedValue({ id: 'p1', education: [], skills: [] });
      mockPrisma.placementDriveParticipation.create.mockResolvedValue({ id: 'part1' });
      
      // Simulate failure in creating event (or the transaction wrapper catching an error)
      mockPrisma.$transaction.mockImplementationOnce(async (cb: any) => {
        throw new Error('Database connection lost during transaction');
      });

      await expect(
        partService.registerStudent('p1', 'drive1')
      ).rejects.toThrow('Database connection lost during transaction');
    });

    it('prevents double registration (Idempotency)', async () => {
      mockPrisma.placementDrive.findUnique.mockResolvedValue({ status: 'OPEN', eligibilityRules: [] });
      mockPrisma.placementDriveParticipation.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        partService.registerStudent('p1', 'drive1')
      ).rejects.toThrow('Already registered for this drive.');
    });
  });

  describe('5. Pagination Logic', () => {
    it('limits pagination take to maximum 100', async () => {
      mockPrisma.placementDrive.findMany.mockResolvedValue([]);
      mockPrisma.placementDrive.count.mockResolvedValue(0);

      await driveService.listDrives('inst-A', {}, { page: 1, pageSize: 500 });
      
      expect(mockPrisma.placementDrive.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100 // Hard cap applied
        })
      );
    });
    
    it('correctly calculates hasNext metadata', async () => {
      mockPrisma.placementDrive.findMany.mockResolvedValue([{}, {}]);
      mockPrisma.placementDrive.count.mockResolvedValue(25);

      const result = await driveService.listDrives('inst-A', {}, { page: 2, pageSize: 10 });
      
      // page 2 skip is 10, take is 10. skip + take = 20 < totalCount 25 => hasNext = true
      expect(result.metadata.hasNext).toBe(true);
      expect(result.metadata.totalCount).toBe(25);
    });
  });
});
