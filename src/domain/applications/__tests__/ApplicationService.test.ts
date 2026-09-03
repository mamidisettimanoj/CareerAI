import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationService } from '../service/ApplicationService';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { ConcurrencyConflictError } from '../types';

describe('ApplicationService - Stabilization', () => {
  let mockPrisma: any;
  let service: ApplicationService;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
      application: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn()
      },
      applicationEvent: {
        create: vi.fn()
      },
      job: {
        findUnique: vi.fn()
      },
      notification: {
        create: vi.fn()
      },
      recruiterCompanyMembership: {
        findUnique: vi.fn()
      }
    };
    service = new ApplicationService(mockPrisma);
  });

  describe('1. Optimistic Concurrency', () => {
    it('blocks status change if version is stale', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'app-1', status: 'APPLIED', version: 2 });
      // Simulate that someone else updated it, so updateMany with expectedVersion=1 returns 0 count
      mockPrisma.application.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.changeStatus('prof-1', 'app-1', ApplicationStatus.SCREENING, 1)).rejects.toThrow(ConcurrencyConflictError);
    });

    it('allows status change and increments version if expectedVersion matches', async () => {
      mockPrisma.application.findUnique.mockResolvedValueOnce({ id: 'app-1', status: 'APPLIED', version: 1 });
      mockPrisma.application.updateMany.mockResolvedValue({ count: 1 }); // success
      mockPrisma.application.findUnique.mockResolvedValueOnce({ id: 'app-1', status: 'SCREENING', version: 2, events: [] }); // returned result

      const result = await service.changeStatus('prof-1', 'app-1', ApplicationStatus.SCREENING, 1);

      expect(mockPrisma.application.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'app-1', version: 1 },
        data: { status: 'SCREENING', version: 2 }
      }));
      expect(mockPrisma.applicationEvent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ newStatus: 'SCREENING', previousStatus: 'APPLIED' })
      }));
    });
  });

  describe('2. Job Disappearance Regression (A/B/C/D/E)', () => {
    it('persists immutable snapshot even if Job is missing/deleted later', async () => {
      // Step A: Job exists initially
      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-123', title: 'Software Engineer', companyName: 'Stark Ind', location: 'NY'
      });
      mockPrisma.application.findFirst.mockResolvedValue(null);
      mockPrisma.application.create.mockResolvedValue({ 
        id: 'app-123', jobTitleSnapshot: 'Software Engineer', companySnapshot: 'Stark Ind' 
      });

      // Step B: Create Application
      await service.createFromJob('prof-1', 'job-123');

      expect(mockPrisma.application.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          jobTitleSnapshot: 'Software Engineer',
          companySnapshot: 'Stark Ind',
          locationSnapshot: 'NY'
        })
      }));

      // Step C & D: Imagine Job is deleted, we just retrieve the Application directly
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-123', jobTitleSnapshot: 'Software Engineer', companySnapshot: 'Stark Ind', events: []
      });

      const app = await service.getApplication('prof-1', 'app-123');

      // Step E: Application still shows original snapshot perfectly
      expect(app?.jobTitleSnapshot).toBe('Software Engineer');
      expect(app?.companySnapshot).toBe('Stark Ind');
    });
  });

  describe('3. Filtering and Pagination', () => {
    it('applies server-side pagination limits', async () => {
      mockPrisma.application.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);
      mockPrisma.application.count.mockResolvedValue(25);

      const res = await service.listApplications('prof-1', {}, { page: 2, pageSize: 10 });

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 10,
        take: 10
      }));
      expect(res.metadata.totalCount).toBe(25);
      expect(res.metadata.hasNext).toBe(true);
    });

    it('enforces a maximum page size of 100', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);

      await service.listApplications('prof-1', {}, { page: 1, pageSize: 500 });
      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });

    it('builds complex where clauses from filters', async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      mockPrisma.application.count.mockResolvedValue(0);

      const d1 = new Date();
      const d2 = new Date();

      await service.listApplications('prof-1', {
        status: [ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER],
        companyName: 'Tech',
        dateFrom: d1,
        dateTo: d2,
        archived: false // default is undefined, so checking false doesn't do much unless we specifically handle it, wait we handle { archived: true }
      });

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['INTERVIEW', 'OFFER'] },
          companySnapshot: { contains: 'Tech', mode: 'insensitive' },
          appliedAt: { gte: d1, lte: d2 },
          archivedAt: null
        })
      }));
    });
  });

  describe('4. Notes and Security', () => {
    it('blocks XSS payloads in notes', async () => {
      await expect(service.addPrivateNote('prof-1', 'app-1', 1, 'Hello <script>alert(1)</script>'))
        .rejects.toThrow('Invalid input detected');
      
      await expect(service.addPrivateNote('prof-1', 'app-1', 1, 'javascript:alert(1)'))
        .rejects.toThrow('Invalid input detected');
    });

    it('blocks empty notes', async () => {
      await expect(service.addPrivateNote('prof-1', 'app-1', 1, '   '))
        .rejects.toThrow('Note cannot be empty');
    });

    it('enforces ownership isolation for notes', async () => {
      mockPrisma.application.findUnique.mockResolvedValue(null);
      await expect(service.addPrivateNote('prof-1', 'app-1', 1, 'Good note'))
        .rejects.toThrow('Application not found or unauthorized');
    });

    it('successfully adds note safely and increments version', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'app-1', status: 'APPLIED', version: 1 });
      mockPrisma.application.updateMany.mockResolvedValue({ count: 1 });
      
      await service.addPrivateNote('prof-1', 'app-1', 1, 'Talked to recruiter');

      expect(mockPrisma.applicationEvent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ note: 'Talked to recruiter' })
      }));
      expect(mockPrisma.application.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: { version: 2 }
      }));
    });
  });

  describe('5. Soft Archive', () => {
    it('sets archivedAt and increments version', async () => {
      mockPrisma.application.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'app-1', archivedAt: new Date() });

      const res = await service.archiveApplication('prof-1', 'app-1', 1);

      expect(mockPrisma.application.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'app-1', profileId: 'prof-1', version: 1 },
        data: expect.objectContaining({ archivedAt: expect.any(Date), version: 2 })
      }));
    });

    it('rejects archive on version mismatch', async () => {
      mockPrisma.application.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.archiveApplication('prof-1', 'app-1', 1)).rejects.toThrow(ConcurrencyConflictError);
    });
  });

  describe('6. State Transitions Coverage', () => {
    it('blocks REJECTED -> INTERVIEW', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'app-1', status: 'REJECTED' });
      await expect(service.changeStatus('prof-1', 'app-1', ApplicationStatus.INTERVIEW, 1))
        .rejects.toThrow('Invalid transition');
    });

    it('allows ON_HOLD -> INTERVIEW', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'app-1', status: 'ON_HOLD', version: 1 });
      mockPrisma.application.updateMany.mockResolvedValue({ count: 1 });
      
      await expect(service.changeStatus('prof-1', 'app-1', ApplicationStatus.INTERVIEW, 1)).resolves.not.toThrow();
    });
  });
});
