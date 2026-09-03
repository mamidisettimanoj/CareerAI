import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driveEligibilityEngine } from '../engine/DriveEligibilityEngine';
import { driveStatusTransitionEngine, participationTransitionEngine } from '../engine/TransitionEngines';
import { PlacementDriveService } from '../service/PlacementDriveService';
import { DriveParticipationService } from '../service/DriveParticipationService';
import { DriveStatus, ParticipationStatus } from '@prisma/client';
import { ConcurrencyConflictError } from '../../applications/types';

describe('Placement Cell Portal Module 17 Tests', () => {

  describe('1. Drive Eligibility Engine', () => {
    const defaultStudent: any = {
      profile: { id: 'p1' },
      education: [
        { endYear: 2025, cgpa: 8.0, activeBacklogs: 0, branch: 'Computer Science' }
      ],
      skills: [{ name: 'React' }, { name: 'Node.js' }]
    };

    it('returns ELIGIBLE when no rules exist', () => {
      const result = driveEligibilityEngine.evaluate(defaultStudent, null);
      expect(result.status).toBe('ELIGIBLE');
    });

    it('enforces minCgpa strict threshold', () => {
      const rule: any = { minCgpa: 8.5, maxActiveBacklogs: null, graduationYears: [], allowedBranches: [], requiredSkills: [] };
      const result = driveEligibilityEngine.evaluate(defaultStudent, rule);
      expect(result.status).toBe('NOT_ELIGIBLE');
      expect(result.reasons.some(r => r.includes('CGPA 8 is below'))).toBe(true);
    });

    it('enforces maxActiveBacklogs', () => {
      const studentWithBacklog: any = {
        ...defaultStudent, education: [{ endYear: 2025, cgpa: 8.0, activeBacklogs: 2, branch: 'CS' }]
      };
      const rule: any = { minCgpa: null, maxActiveBacklogs: 0, graduationYears: [], allowedBranches: [], requiredSkills: [] };
      const result = driveEligibilityEngine.evaluate(studentWithBacklog, rule);
      expect(result.status).toBe('NOT_ELIGIBLE');
    });

    it('returns INSUFFICIENT_DATA if CGPA is missing but required', () => {
      const studentNoCgpa: any = {
        ...defaultStudent, education: [{ endYear: 2025, cgpa: null, activeBacklogs: 0, branch: 'CS' }]
      };
      const rule: any = { minCgpa: 7.0, maxActiveBacklogs: null, graduationYears: [], allowedBranches: [], requiredSkills: [] };
      const result = driveEligibilityEngine.evaluate(studentNoCgpa, rule);
      expect(result.status).toBe('INSUFFICIENT_DATA');
    });

    it('enforces branch/program filtering', () => {
      const rule: any = { minCgpa: null, maxActiveBacklogs: null, graduationYears: [], allowedBranches: ['Mechanical'], requiredSkills: [] };
      const result = driveEligibilityEngine.evaluate(defaultStudent, rule);
      expect(result.status).toBe('NOT_ELIGIBLE');
    });

    it('enforces required skills', () => {
      const rule: any = { minCgpa: null, maxActiveBacklogs: null, graduationYears: [], allowedBranches: [], requiredSkills: ['React', 'Python'] };
      const result = driveEligibilityEngine.evaluate(defaultStudent, rule);
      expect(result.status).toBe('NOT_ELIGIBLE');
      expect(result.reasons.some(r => r.includes('Missing required skills: Python'))).toBe(true);
    });

    it('returns ELIGIBLE when all multiple criteria match', () => {
      const rule: any = { minCgpa: 7.5, maxActiveBacklogs: 1, graduationYears: [2025], allowedBranches: ['Computer Science'], requiredSkills: ['React'] };
      const result = driveEligibilityEngine.evaluate(defaultStudent, rule);
      expect(result.status).toBe('ELIGIBLE');
    });
  });

  describe('2. State Transition Engines', () => {
    it('blocks DRAFT to COMPLETED', () => {
      expect(driveStatusTransitionEngine.validate(DriveStatus.DRAFT, DriveStatus.COMPLETED).valid).toBe(false);
    });
    
    it('allows OPEN to CLOSED', () => {
      expect(driveStatusTransitionEngine.validate(DriveStatus.OPEN, DriveStatus.CLOSED).valid).toBe(true);
    });

    it('blocks REGISTERED to SELECTED without INTERVIEW/ASSESSMENT', () => {
      expect(participationTransitionEngine.validate(ParticipationStatus.REGISTERED, ParticipationStatus.SELECTED).valid).toBe(false);
    });

    it('allows INTERVIEW to SELECTED', () => {
      expect(participationTransitionEngine.validate(ParticipationStatus.INTERVIEW, ParticipationStatus.SELECTED).valid).toBe(true);
    });
  });

  describe('3. Placement Drive Service', () => {
    let mockPrisma: any;
    let driveService: PlacementDriveService;

    beforeEach(() => {
      mockPrisma = {
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
        company: { findUnique: vi.fn() },
        placementDrive: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), findMany: vi.fn(), count: vi.fn() }
      };
      driveService = new PlacementDriveService(mockPrisma);
    });

    it('blocks drive creation for cross-tenant companies', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: 'c1', institutionId: 'other-inst' });
      await expect(driveService.createDrive('my-inst', { companyId: 'c1', date: new Date(), roles: [] }))
        .rejects.toThrow('Company not authorized for this institution.');
    });

    it('enforces optimistic concurrency on drive status changes', async () => {
      mockPrisma.placementDrive.findUnique.mockResolvedValue({ id: 'd1', institutionId: 'my-inst', status: 'DRAFT', version: 1 });
      mockPrisma.placementDrive.updateMany.mockResolvedValue({ count: 0 }); // simulate stale version

      await expect(driveService.changeStatus('my-inst', 'd1', DriveStatus.OPEN, 1)).rejects.toThrow(ConcurrencyConflictError);
    });
  });

  describe('4. Participation Service', () => {
    let mockPrisma: any;
    let partService: DriveParticipationService;

    beforeEach(() => {
      mockPrisma = {
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
        placementDrive: { findUnique: vi.fn() },
        placementDriveParticipation: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
        profile: { findUnique: vi.fn() },
        driveParticipationEvent: { create: vi.fn() }
      };
      partService = new DriveParticipationService(mockPrisma);
    });

    it('blocks registration if drive is not OPEN', async () => {
      mockPrisma.placementDrive.findUnique.mockResolvedValue({ status: 'DRAFT', eligibilityRules: [] });
      await expect(partService.registerStudent('p1', 'd1')).rejects.toThrow('Drive is not open for registration.');
    });

    it('blocks registration if duplicate', async () => {
      mockPrisma.placementDrive.findUnique.mockResolvedValue({ status: 'OPEN', eligibilityRules: [] });
      mockPrisma.placementDriveParticipation.findUnique.mockResolvedValue({ id: 'part1' }); // already registered
      await expect(partService.registerStudent('p1', 'd1')).rejects.toThrow('Already registered for this drive.');
    });

    it('blocks cross-institution IDOR on participation status change', async () => {
      mockPrisma.placementDriveParticipation.findUnique.mockResolvedValue({
        id: 'part1', placementDrive: { institutionId: 'inst-A' }
      });
      // Admin from inst-B tries to edit
      await expect(partService.changeParticipationStatus('admin1', 'inst-B', 'part1', ParticipationStatus.SHORTLISTED, 1))
        .rejects.toThrow('Unauthorized cross-institution access.');
    });

    it('creates immutable history event on status change', async () => {
      mockPrisma.placementDriveParticipation.findUnique.mockResolvedValue({
        id: 'part1', status: 'REGISTERED', placementDrive: { institutionId: 'inst-A' }
      });
      mockPrisma.placementDriveParticipation.updateMany.mockResolvedValue({ count: 1 });

      await partService.changeParticipationStatus('admin1', 'inst-A', 'part1', ParticipationStatus.SHORTLISTED, 1);

      expect(mockPrisma.driveParticipationEvent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ previousStatus: 'REGISTERED', newStatus: 'SHORTLISTED', actorId: 'admin1' })
      }));
    });
  });
});
