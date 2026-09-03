/**
 * MODULE 18B — Recruiter Portal Stabilization Tests
 *
 * Covers:
 *  - RBAC & company isolation (jobs, candidates, notes, events, resume)
 *  - Job lifecycle (all legal and all illegal transitions)
 *  - Recruitment lifecycle (full matrix, terminal states)
 *  - Candidate privacy & DTO mapping
 *  - Optimistic concurrency
 *  - Notes authorization
 *  - Resume access authorization (fail-closed)
 *  - Candidate application creation (student-authorized path)
 *  - Filtering & pagination guards
 *  - Audit event integrity
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecruiterJobService } from '../service/RecruiterJobService';
import { RecruitmentCandidateService } from '../service/RecruitmentCandidateService';
import { RecruitmentLifecycleService } from '../service/RecruitmentLifecycleService';
import { JobStatus, RecruitmentStage } from '@prisma/client';
import { ConcurrencyConflictError } from '../../applications/types';

// ─── SHARED MOCK FACTORY ────────────────────────────────────────────────────

function makeMockPrisma() {
  return {
    $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
    job: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    candidateApplication: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    recruitmentEvent: { create: vi.fn() },
    recruiterNote: { create: vi.fn() },
    resume: { findUnique: vi.fn() },
    profile: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
    recruiterCompanyMembership: { findMany: vi.fn().mockResolvedValue([]) }
  };
}

let mockPrisma: ReturnType<typeof makeMockPrisma>;
let jobService: RecruiterJobService;
let candidateService: RecruitmentCandidateService;
let lifecycleService: RecruitmentLifecycleService;

beforeEach(() => {
  mockPrisma = makeMockPrisma();
  // Allow $transaction to resolve correctly with fresh mock per test
  mockPrisma.$transaction = vi.fn(async (cb: any) => cb(mockPrisma));
  jobService = new RecruiterJobService(mockPrisma as any);
  candidateService = new RecruitmentCandidateService(mockPrisma as any);
  lifecycleService = new RecruitmentLifecycleService(mockPrisma as any);
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Company Isolation — Jobs
// ═══════════════════════════════════════════════════════════════════════════
describe('Company Isolation — Jobs', () => {
  it('1. listJobs scopes where clause to companyId', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);
    mockPrisma.job.count.mockResolvedValue(0);
    await jobService.listJobs('comp-A', 1);
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'comp-A' } })
    );
  });

  it('2. getJob rejects cross-company ID (comp-A cannot read comp-B job)', async () => {
    mockPrisma.job.findUnique.mockResolvedValue(null);
    await expect(jobService.getJob('comp-A', 'job-B')).rejects.toThrow('Job not found or unauthorized.');
    expect(mockPrisma.job.findUnique).toHaveBeenCalledWith({ where: { id: 'job-B', companyId: 'comp-A' } });
  });

  it('3. changeStatus rejects cross-company job mutation', async () => {
    mockPrisma.job.findUnique.mockResolvedValue(null);
    await expect(jobService.changeStatus('comp-A', 'job-B', JobStatus.PUBLISHED)).rejects.toThrow('Job not found or unauthorized.');
  });

  it('4. updateJob rejects cross-company job', async () => {
    mockPrisma.job.findUnique.mockResolvedValue(null);
    await expect(jobService.updateJob('comp-A', 'job-B', { title: 'Hack' })).rejects.toThrow('Job not found or unauthorized.');
  });

  it('5. createJob always writes companyId from server arg (not client-controlled)', async () => {
    mockPrisma.job.create.mockResolvedValue({ id: 'j1' });
    await jobService.createJob('comp-SERVER', { title: 'Eng', description: 'Desc' });
    expect(mockPrisma.job.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ companyId: 'comp-SERVER' }) })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Job Lifecycle — Deterministic Transitions
// ═══════════════════════════════════════════════════════════════════════════
describe('Job Lifecycle — Deterministic Transitions', () => {
  it('6. DRAFT → PUBLISHED is allowed', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.DRAFT, publishedAt: null });
    mockPrisma.job.update.mockResolvedValue({ id: 'j1', status: JobStatus.PUBLISHED });
    const result = await jobService.changeStatus('c1', 'j1', JobStatus.PUBLISHED);
    expect(result.status).toBe(JobStatus.PUBLISHED);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: JobStatus.PUBLISHED, isActive: true }) })
    );
  });

  it('7. PUBLISHED → CLOSED is allowed', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.PUBLISHED, publishedAt: new Date() });
    mockPrisma.job.update.mockResolvedValue({ id: 'j1', status: JobStatus.CLOSED });
    await expect(jobService.changeStatus('c1', 'j1', JobStatus.CLOSED)).resolves.toBeTruthy();
  });

  it('8. CLOSED → ARCHIVED is allowed', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.CLOSED, publishedAt: new Date() });
    mockPrisma.job.update.mockResolvedValue({ id: 'j1', status: JobStatus.ARCHIVED });
    await expect(jobService.changeStatus('c1', 'j1', JobStatus.ARCHIVED)).resolves.toBeTruthy();
  });

  it('9. DRAFT → CLOSED is blocked', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.DRAFT });
    await expect(jobService.changeStatus('c1', 'j1', JobStatus.CLOSED)).rejects.toThrow('Invalid job lifecycle transition');
  });

  it('10. DRAFT → ARCHIVED is blocked', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.DRAFT });
    await expect(jobService.changeStatus('c1', 'j1', JobStatus.ARCHIVED)).rejects.toThrow('Invalid job lifecycle transition');
  });

  it('11. PUBLISHED → DRAFT is blocked', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.PUBLISHED });
    await expect(jobService.changeStatus('c1', 'j1', JobStatus.DRAFT)).rejects.toThrow('Invalid job lifecycle transition');
  });

  it('12. CLOSED → PUBLISHED is blocked', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.CLOSED });
    await expect(jobService.changeStatus('c1', 'j1', JobStatus.PUBLISHED)).rejects.toThrow('Invalid job lifecycle transition');
  });

  it('13. ARCHIVED is terminal — no transitions allowed', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.ARCHIVED });
    await expect(jobService.changeStatus('c1', 'j1', JobStatus.PUBLISHED)).rejects.toThrow('Invalid job lifecycle transition');
    await expect(jobService.changeStatus('c1', 'j1', JobStatus.DRAFT)).rejects.toThrow('Invalid job lifecycle transition');
  });

  it('14. updateJob blocked for non-DRAFT jobs', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.PUBLISHED });
    await expect(jobService.updateJob('c1', 'j1', { title: 'Changed' })).rejects.toThrow('Only DRAFT jobs can be edited.');
  });

  it('15. createJob validates required title', async () => {
    await expect(jobService.createJob('c1', { title: '', description: 'Desc' })).rejects.toThrow('Job title is required.');
  });

  it('16. createJob validates required description', async () => {
    await expect(jobService.createJob('c1', { title: 'SWE', description: '' })).rejects.toThrow('Job description is required.');
  });

  it('17. PUBLISHED job sets publishedAt and isActive:true', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: JobStatus.DRAFT, publishedAt: null });
    mockPrisma.job.update.mockResolvedValue({ id: 'j1', status: JobStatus.PUBLISHED });
    await jobService.changeStatus('c1', 'j1', JobStatus.PUBLISHED);
    const updateCall = mockPrisma.job.update.mock.calls[0][0];
    expect(updateCall.data.publishedAt).toBeTruthy();
    expect(updateCall.data.isActive).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Company Isolation — Candidates & Applications
// ═══════════════════════════════════════════════════════════════════════════
describe('Company Isolation — Candidates', () => {
  it('18. listCandidates scopes where clause to job.companyId', async () => {
    mockPrisma.candidateApplication.findMany.mockResolvedValue([]);
    mockPrisma.candidateApplication.count.mockResolvedValue(0);
    await candidateService.listCandidates('comp-A', {});
    expect(mockPrisma.candidateApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ job: { companyId: 'comp-A' } }) })
    );
  });

  it('19. getCandidateDetail rejects cross-company applicationId', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(null);
    await expect(candidateService.getCandidateDetail('comp-A', 'app-B'))
      .rejects.toThrow('Candidate application not found or unauthorized.');
    expect(mockPrisma.candidateApplication.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'app-B', job: { companyId: 'comp-A' } } })
    );
  });

  it('20. addNote rejects cross-company applicationId', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(null);
    await expect(candidateService.addNote('comp-A', 'actor1', 'app-B', 'Note'))
      .rejects.toThrow('Candidate application not found or unauthorized.');
    expect(mockPrisma.candidateApplication.findUnique).toHaveBeenCalledWith({
      where: { id: 'app-B', job: { companyId: 'comp-A' } }
    });
  });

  it('21. addNote validates empty content', async () => {
    await expect(candidateService.addNote('comp-A', 'actor1', 'app-1', ''))
      .rejects.toThrow('Note content cannot be empty.');
  });

  it('22. addNote validates content too long', async () => {
    await expect(candidateService.addNote('comp-A', 'actor1', 'app-1', 'x'.repeat(5001)))
      .rejects.toThrow('Note exceeds maximum length');
  });

  it('23. addNote uses server-provided actorId — not arbitrary user-supplied', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({ id: 'app-1' });
    mockPrisma.recruiterNote.create.mockResolvedValue({ id: 'n1' });
    await candidateService.addNote('comp-A', 'server-actor-id', 'app-1', 'Test note');
    expect(mockPrisma.recruiterNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorId: 'server-actor-id' })
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Candidate Privacy — DTO Isolation
// ═══════════════════════════════════════════════════════════════════════════
describe('Candidate Privacy — DTO Isolation', () => {
  const makeAppRow = (overrides: any = {}) => ({
    id: 'app1', jobId: 'job1', job: { id: 'job1', title: 'Engineer' },
    profileId: 'prof1', appliedAt: new Date(), status: RecruitmentStage.RECEIVED, resumeId: null,
    profile: {
      firstName: 'Alice', lastName: 'Smith',
      education: [{ degreeType: 'BTech', branch: 'CS', endYear: 2025 }],
      skills: [{ name: 'Go' }],
      // These MUST NOT appear in DTO
      copilotConversations: [{ id: 'conv1', content: 'Private AI' }],
      applications: [{ id: 'app-tracker-1', notes: 'Private student notes' }],
      preparationTasks: [{ id: 'task1', title: 'Study' }],
    },
    ...overrides
  });

  it('24. listCandidates DTO has only authorized fields', async () => {
    mockPrisma.candidateApplication.findMany.mockResolvedValue([makeAppRow()]);
    mockPrisma.candidateApplication.count.mockResolvedValue(1);
    const { data } = await candidateService.listCandidates('comp-A', {});
    const dto = data[0];
    expect(dto).toHaveProperty('candidateName', 'Alice Smith');
    expect(dto).toHaveProperty('stage');
    expect(dto).toHaveProperty('topSkills');
    expect(dto).not.toHaveProperty('profile');
    expect(dto).not.toHaveProperty('copilotConversations');
    expect(dto).not.toHaveProperty('applications');
    expect(dto).not.toHaveProperty('preparationTasks');
    expect(dto).not.toHaveProperty('profileId'); // profileId should NOT be in list DTO
  });

  it('25. getCandidateDetail DTO does not contain Application.notes or Copilot data', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({
      id: 'app1', status: RecruitmentStage.RECEIVED, appliedAt: new Date(), version: 1,
      job: { id: 'j1', title: 'Eng', status: 'PUBLISHED' },
      profile: {
        id: 'p1', firstName: 'Bob', lastName: 'Jones',
        education: [], experience: [], skills: [], projects: [],
        // Internal fields that must not appear
        copilotConversations: 'secret',
        applications: [{ notes: 'private tracker notes' }],
      },
      events: [], notes: [], resume: null
    });
    const detail = await candidateService.getCandidateDetail('comp-A', 'app1');
    expect(detail.candidate).not.toHaveProperty('copilotConversations');
    expect(detail.candidate).not.toHaveProperty('applications');
    // notes key in detail refers to RecruiterNotes, not Application.notes
    expect(Array.isArray(detail.notes)).toBe(true);
    expect(detail).not.toHaveProperty('applicationTrackerNotes');
  });

  it('26. resume object in detail DTO never exposes raw fileUrl (storage key)', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({
      id: 'app1', status: RecruitmentStage.RECEIVED, appliedAt: new Date(), version: 1,
      job: { id: 'j1', title: 'Eng', status: 'PUBLISHED' },
      profile: { id: 'p1', firstName: 'X', lastName: 'Y', education: [], experience: [], skills: [], projects: [] },
      events: [], notes: [],
      resume: { id: 'r1', status: 'PROCESSED', completeness: 'HIGH', fileUrl: 'private/storage/key.pdf' }
    });
    const detail = await candidateService.getCandidateDetail('comp-A', 'app1');
    // resume DTO must not include fileUrl
    expect(detail.resume).toBeTruthy();
    expect((detail.resume as any)?.fileUrl).toBeUndefined();
    expect(detail.resume).toHaveProperty('id');
    expect(detail.resume).toHaveProperty('status');
    expect(detail.resume).toHaveProperty('completeness');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Resume Authorization
// ═══════════════════════════════════════════════════════════════════════════
describe('Resume Authorization — getAuthorizedResumeUrl', () => {
  it('27. fails closed when application not found for companyId', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(null);
    await expect(candidateService.getAuthorizedResumeUrl('comp-A', 'app-X'))
      .rejects.toThrow('Application not found or unauthorized.');
  });

  it('28. fails closed when no resume attached', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({ id: 'app1', resume: null });
    await expect(candidateService.getAuthorizedResumeUrl('comp-A', 'app1'))
      .rejects.toThrow('No resume is attached to this application.');
  });

  it('29. fails closed when fileUrl is empty', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({
      id: 'app1', resume: { id: 'r1', fileUrl: '' }
    });
    await expect(candidateService.getAuthorizedResumeUrl('comp-A', 'app1'))
      .rejects.toThrow('Resume storage reference is missing.');
  });

  it('30. fails closed when Supabase env vars not set', async () => {
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    mockPrisma.candidateApplication.findUnique.mockResolvedValue({
      id: 'app1', resume: { id: 'r1', fileUrl: 'resumes/some.pdf' }
    });

    await expect(candidateService.getAuthorizedResumeUrl('comp-A', 'app1'))
      .rejects.toThrow('Resume download is temporarily unavailable');

    process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  });

  it('31. verification requires application to match job.companyId (cross-company blocked)', async () => {
    // Mock returns null because `where: { id: 'app-X', job: { companyId: 'comp-A' } }` matches nothing
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(null);
    await expect(candidateService.getAuthorizedResumeUrl('comp-A', 'app-X'))
      .rejects.toThrow('Application not found or unauthorized.');
    expect(mockPrisma.candidateApplication.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'app-X', job: { companyId: 'comp-A' } } })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Recruitment Lifecycle — Full Matrix
// ═══════════════════════════════════════════════════════════════════════════
describe('Recruitment Lifecycle — Full Transition Matrix', () => {
  const app = (status: RecruitmentStage) => ({ id: 'app1', status, job: { companyId: 'c1' } });

  const validCases: [RecruitmentStage, RecruitmentStage][] = [
    [RecruitmentStage.RECEIVED, RecruitmentStage.REVIEWING],
    [RecruitmentStage.RECEIVED, RecruitmentStage.SHORTLISTED],
    [RecruitmentStage.RECEIVED, RecruitmentStage.REJECTED],
    [RecruitmentStage.RECEIVED, RecruitmentStage.WITHDRAWN],
    [RecruitmentStage.REVIEWING, RecruitmentStage.SHORTLISTED],
    [RecruitmentStage.SHORTLISTED, RecruitmentStage.ASSESSMENT],
    [RecruitmentStage.SHORTLISTED, RecruitmentStage.INTERVIEW],
    [RecruitmentStage.ASSESSMENT, RecruitmentStage.INTERVIEW],
    [RecruitmentStage.INTERVIEW, RecruitmentStage.OFFER],
    [RecruitmentStage.OFFER, RecruitmentStage.HIRED],
  ];

  for (const [from, to] of validCases) {
    it(`32. VALID: ${from} → ${to}`, async () => {
      mockPrisma.candidateApplication.findUnique.mockResolvedValue(app(from));
      mockPrisma.candidateApplication.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.candidateApplication.findUnique
        .mockResolvedValueOnce(app(from))
        .mockResolvedValueOnce({ id: 'app1', status: to, events: [] });
      await expect(lifecycleService.changeStage('c1', 'actor', 'app1', to, 1)).resolves.toBeTruthy();
    });
  }

  const invalidCases: [RecruitmentStage, RecruitmentStage][] = [
    [RecruitmentStage.RECEIVED, RecruitmentStage.HIRED],
    [RecruitmentStage.RECEIVED, RecruitmentStage.OFFER],
    [RecruitmentStage.REVIEWING, RecruitmentStage.ASSESSMENT],
    [RecruitmentStage.HIRED, RecruitmentStage.REVIEWING],
    [RecruitmentStage.REJECTED, RecruitmentStage.REVIEWING],
    [RecruitmentStage.WITHDRAWN, RecruitmentStage.RECEIVED],
  ];

  for (const [from, to] of invalidCases) {
    it(`33. INVALID: ${from} → ${to} blocked`, async () => {
      mockPrisma.candidateApplication.findUnique.mockResolvedValue(app(from));
      await expect(lifecycleService.changeStage('c1', 'actor', 'app1', to, 1))
        .rejects.toThrow('Invalid stage transition');
    });
  }

  it('34. HIRED is terminal', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(app(RecruitmentStage.HIRED));
    await expect(lifecycleService.changeStage('c1', 'actor', 'app1', RecruitmentStage.OFFER, 1))
      .rejects.toThrow('Invalid stage transition');
  });

  it('35. REJECTED is terminal', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(app(RecruitmentStage.REJECTED));
    await expect(lifecycleService.changeStage('c1', 'actor', 'app1', RecruitmentStage.REVIEWING, 1))
      .rejects.toThrow('Invalid stage transition');
  });

  it('36. WITHDRAWN is terminal', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(app(RecruitmentStage.WITHDRAWN));
    await expect(lifecycleService.changeStage('c1', 'actor', 'app1', RecruitmentStage.REVIEWING, 1))
      .rejects.toThrow('Invalid stage transition');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Audit Trail Integrity
// ═══════════════════════════════════════════════════════════════════════════
describe('Audit Trail Integrity', () => {
  it('37. Valid transition creates RecruitmentEvent with previousStage and newStage', async () => {
    mockPrisma.candidateApplication.findUnique
      .mockResolvedValueOnce({ id: 'app1', status: RecruitmentStage.RECEIVED })
      .mockResolvedValueOnce({ id: 'app1', status: RecruitmentStage.REVIEWING, events: [] });
    mockPrisma.candidateApplication.updateMany.mockResolvedValue({ count: 1 });
    await lifecycleService.changeStage('c1', 'actor1', 'app1', RecruitmentStage.REVIEWING, 1, 'First review');
    expect(mockPrisma.recruitmentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 'app1',
        actorId: 'actor1',
        previousStage: RecruitmentStage.RECEIVED,
        newStage: RecruitmentStage.REVIEWING,
        note: 'First review',
      })
    });
  });

  it('38. Invalid transition creates NO event', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({ id: 'app1', status: RecruitmentStage.RECEIVED });
    await expect(
      lifecycleService.changeStage('c1', 'actor1', 'app1', RecruitmentStage.HIRED, 1)
    ).rejects.toThrow();
    expect(mockPrisma.recruitmentEvent.create).not.toHaveBeenCalled();
  });

  it('39. Unauthorized application creates NO event', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(null);
    await expect(
      lifecycleService.changeStage('comp-A', 'actor1', 'app-X', RecruitmentStage.REVIEWING, 1)
    ).rejects.toThrow('Application not found or unauthorized.');
    expect(mockPrisma.recruitmentEvent.create).not.toHaveBeenCalled();
  });

  it('40. Stale optimistic lock creates NO event', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({ id: 'app1', status: RecruitmentStage.RECEIVED });
    mockPrisma.candidateApplication.updateMany.mockResolvedValue({ count: 0 }); // stale
    await expect(
      lifecycleService.changeStage('c1', 'actor1', 'app1', RecruitmentStage.REVIEWING, 1)
    ).rejects.toThrowError(ConcurrencyConflictError);
    expect(mockPrisma.recruitmentEvent.create).not.toHaveBeenCalled();
  });

  it('41. changeStage actorId comes from service call (server-side) not from client', async () => {
    mockPrisma.candidateApplication.findUnique
      .mockResolvedValueOnce({ id: 'app1', status: RecruitmentStage.RECEIVED })
      .mockResolvedValueOnce({ id: 'app1', status: RecruitmentStage.REVIEWING, events: [] });
    mockPrisma.candidateApplication.updateMany.mockResolvedValue({ count: 1 });
    await lifecycleService.changeStage('c1', 'SERVER-ACTOR', 'app1', RecruitmentStage.REVIEWING, 1);
    expect(mockPrisma.recruitmentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorId: 'SERVER-ACTOR' })
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: Optimistic Concurrency
// ═══════════════════════════════════════════════════════════════════════════
describe('Optimistic Concurrency', () => {
  it('42. Stale version (version=1, DB=version=2) throws ConcurrencyConflictError', async () => {
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({ id: 'app1', status: RecruitmentStage.RECEIVED });
    mockPrisma.candidateApplication.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      lifecycleService.changeStage('c1', 'actor', 'app1', RecruitmentStage.REVIEWING, 1)
    ).rejects.toThrowError(ConcurrencyConflictError);
  });

  it('43. Correct version (count=1) succeeds and increments version', async () => {
    mockPrisma.candidateApplication.findUnique
      .mockResolvedValueOnce({ id: 'app1', status: RecruitmentStage.RECEIVED })
      .mockResolvedValueOnce({ id: 'app1', status: RecruitmentStage.REVIEWING, events: [] });
    mockPrisma.candidateApplication.updateMany.mockResolvedValue({ count: 1 });
    await lifecycleService.changeStage('c1', 'actor', 'app1', RecruitmentStage.REVIEWING, 5);
    expect(mockPrisma.candidateApplication.updateMany).toHaveBeenCalledWith({
      where: { id: 'app1', version: 5 },
      data: expect.objectContaining({ status: RecruitmentStage.REVIEWING, version: 6 })
    });
  });

  it('44. Two simultaneous stale updates cannot both succeed', async () => {
    // First call succeeds, second is stale
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({ id: 'app1', status: RecruitmentStage.RECEIVED });
    mockPrisma.candidateApplication.updateMany
      .mockResolvedValueOnce({ count: 1 }) // first update wins
      .mockResolvedValueOnce({ count: 0 }); // second is stale
    mockPrisma.candidateApplication.findUnique
      .mockResolvedValueOnce({ id: 'app1', status: RecruitmentStage.RECEIVED })
      .mockResolvedValueOnce({ id: 'app1', status: RecruitmentStage.REVIEWING, events: [] })
      .mockResolvedValueOnce({ id: 'app1', status: RecruitmentStage.RECEIVED });

    await lifecycleService.changeStage('c1', 'actor-A', 'app1', RecruitmentStage.REVIEWING, 1);
    await expect(
      lifecycleService.changeStage('c1', 'actor-B', 'app1', RecruitmentStage.REVIEWING, 1)
    ).rejects.toThrowError(ConcurrencyConflictError);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: Student-Side Application Creation
// ═══════════════════════════════════════════════════════════════════════════
describe('Student Application Creation — applyToJob', () => {
  it('45. Student can apply to a PUBLISHED job', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: 'PUBLISHED' });
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(null); // no duplicate
    mockPrisma.candidateApplication.create.mockResolvedValue({ id: 'app1' });
    mockPrisma.recruitmentEvent.create.mockResolvedValue({});
    const result = await candidateService.applyToJob('profile-1', 'j1');
    expect(result).toEqual({ id: 'app1' });
    expect(mockPrisma.candidateApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ profileId: 'profile-1', jobId: 'j1', status: 'RECEIVED' }) })
    );
  });

  it('46. Student cannot apply to a DRAFT job', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: 'DRAFT' });
    await expect(candidateService.applyToJob('profile-1', 'j1'))
      .rejects.toThrow('Job is not available for application.');
  });

  it('47. Student cannot apply to a non-existent job', async () => {
    mockPrisma.job.findUnique.mockResolvedValue(null);
    await expect(candidateService.applyToJob('profile-1', 'j-fake'))
      .rejects.toThrow('Job is not available for application.');
  });

  it('48. Duplicate application is blocked', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: 'PUBLISHED' });
    mockPrisma.candidateApplication.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(candidateService.applyToJob('profile-1', 'j1'))
      .rejects.toThrow('You have already applied to this job.');
  });

  it('49. Resume must belong to the applying student', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: 'PUBLISHED' });
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(null);
    mockPrisma.resume.findUnique.mockResolvedValue(null); // resume doesn't belong to this profile
    await expect(candidateService.applyToJob('profile-1', 'j1', 'resume-other-user'))
      .rejects.toThrow('Resume not found or unauthorized.');
  });

  it('50. Applying creates initial RECEIVED RecruitmentEvent', async () => {
    mockPrisma.job.findUnique.mockResolvedValue({ id: 'j1', companyId: 'c1', status: 'PUBLISHED' });
    mockPrisma.candidateApplication.findUnique.mockResolvedValue(null);
    mockPrisma.candidateApplication.create.mockResolvedValue({ id: 'app-new' });
    mockPrisma.recruitmentEvent.create.mockResolvedValue({});
    await candidateService.applyToJob('profile-1', 'j1');
    expect(mockPrisma.recruitmentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ newStage: 'RECEIVED', applicationId: 'app-new' })
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: Pagination Guards
// ═══════════════════════════════════════════════════════════════════════════
describe('Pagination & Filtering Guards', () => {
  beforeEach(() => {
    mockPrisma.candidateApplication.findMany.mockResolvedValue([]);
    mockPrisma.candidateApplication.count.mockResolvedValue(0);
    mockPrisma.job.findMany.mockResolvedValue([]);
    mockPrisma.job.count.mockResolvedValue(0);
  });

  it('51. pageSize > 100 is capped at 100 for jobs', async () => {
    await jobService.listJobs('c1', 1, 999);
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });

  it('52. pageSize > 100 is capped at 100 for candidates', async () => {
    await candidateService.listCandidates('c1', {}, 1, 999);
    expect(mockPrisma.candidateApplication.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });

  it('53. jobId filter is still scoped within company constraint', async () => {
    await candidateService.listCandidates('comp-A', { jobId: 'job-1' });
    const call = mockPrisma.candidateApplication.findMany.mock.calls[0][0];
    expect(call.where.job).toEqual({ companyId: 'comp-A' });
    expect(call.where.jobId).toBe('job-1');
  });

  it('54. stage filter is still scoped within company constraint', async () => {
    await candidateService.listCandidates('comp-A', { stage: 'REVIEWING' });
    const call = mockPrisma.candidateApplication.findMany.mock.calls[0][0];
    expect(call.where.job).toEqual({ companyId: 'comp-A' });
    expect(call.where.status).toBe('REVIEWING');
  });

  it('55. date filters are applied within company constraint', async () => {
    const after = new Date('2024-01-01');
    const before = new Date('2024-12-31');
    await candidateService.listCandidates('comp-A', { appliedAfter: after, appliedBefore: before });
    const call = mockPrisma.candidateApplication.findMany.mock.calls[0][0];
    expect(call.where.appliedAt).toEqual({ gte: after, lte: before });
    expect(call.where.job).toEqual({ companyId: 'comp-A' });
  });

  it('56. hasNext is false on last page', async () => {
    mockPrisma.candidateApplication.count.mockResolvedValue(5);
    mockPrisma.candidateApplication.findMany.mockResolvedValue(Array(5).fill(null).map(() => ({
      id: 'app', job: { id: 'j', title: 'T' },
      profile: { firstName: 'A', lastName: 'B', education: [], skills: [] },
      appliedAt: new Date(), status: 'RECEIVED', resumeId: null
    })));
    const { metadata } = await candidateService.listCandidates('c1', {}, 1, 5);
    expect(metadata.hasNext).toBe(false);
  });

  it('57. hasNext is true when more pages exist', async () => {
    mockPrisma.candidateApplication.count.mockResolvedValue(21);
    mockPrisma.candidateApplication.findMany.mockResolvedValue(Array(20).fill(null).map(() => ({
      id: 'app', job: { id: 'j', title: 'T' },
      profile: { firstName: 'A', lastName: 'B', education: [], skills: [] },
      appliedAt: new Date(), status: 'RECEIVED', resumeId: null
    })));
    const { metadata } = await candidateService.listCandidates('c1', {}, 1, 20);
    expect(metadata.hasNext).toBe(true);
  });

  it('58. page 2 skips first pageSize results', async () => {
    mockPrisma.candidateApplication.findMany.mockResolvedValue([]);
    mockPrisma.candidateApplication.count.mockResolvedValue(25);
    await candidateService.listCandidates('c1', {}, 2, 10);
    expect(mockPrisma.candidateApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });
});
