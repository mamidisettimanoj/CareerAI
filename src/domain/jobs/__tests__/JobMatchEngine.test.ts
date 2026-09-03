import { describe, it, expect, vi } from 'vitest';
import { jobMatchEngine } from '../engine/JobMatchEngine';
import { CanonicalJob, JobFreshness } from '../types/job.types';
import { Skill, Profile } from '@prisma/client';

// Mock dependencies
vi.mock('../../../domain/skills/engine/SkillNormalizer', () => ({
  normalizeSkillName: vi.fn((s) => s.toUpperCase()) // Simple mock behavior
}));

vi.mock('../../../domain/career-intelligence/config/roleCatalog', () => ({
  getRoleDefinition: vi.fn((roleId) => {
    if (roleId === 'SOFTWARE ENGINEER') return { id: 'SOFTWARE ENGINEER' };
    return undefined;
  })
}));

describe('JobMatchEngine', () => {
  const createMockJob = (overrides?: Partial<CanonicalJob>): CanonicalJob => ({
    id: 'job-1',
    source: 'INTERNAL',
    sourceJobId: 'src-job-1',
    title: 'SOFTWARE ENGINEER',
    companyName: 'Tech Corp',
    description: 'A great job',
    requiredSkills: ['REACT', 'NODEJS'],
    preferredSkills: ['DOCKER'],
    fetchedAt: new Date(),
    isActive: true,
    freshness: JobFreshness.FRESH,
    ...overrides
  });

  const createMockCandidate = (overrides?: any) => ({
    profile: { targetRole: 'SOFTWARE ENGINEER' } as Profile,
    skills: [
      { name: 'React', proficiency: 80 },
      { name: 'NodeJS', proficiency: 50 }, // Weak match
      { name: 'Docker', proficiency: 90 }  // Preferred matched
    ] as Skill[],
    academics: { cgpa: 8.5, activeBacklogs: 0 },
    experienceMonths: 24,
    ...overrides
  });

  describe('1. Skill Matching Logic', () => {
    it('should identify perfectly matched, weak, and missing required skills', () => {
      const job = createMockJob({ requiredSkills: ['REACT', 'NODEJS', 'AWS'] });
      const candidate = createMockCandidate();
      
      const result = jobMatchEngine.calculateMatch(job, candidate);
      
      expect(result.matchedSkills).toContain('REACT');
      expect(result.weakSkills).toContain('NODEJS');
      expect(result.missingSkills).toContain('AWS');
    });

    it('should reward preferred skills independently', () => {
      const job = createMockJob();
      const candidate = createMockCandidate();
      
      const result = jobMatchEngine.calculateMatch(job, candidate);
      
      // Node is weak (50%), React is strong. Required score = (1 + 0.5) / 2 = 75%
      expect(result.requiredSkillMatch).toBe(75);
      expect(result.preferredSkillMatch).toBe(100); // Has Docker
    });
  });

  describe('2. Role Matching', () => {
    it('should incorporate role similarity scores', () => {
      const job = createMockJob({ title: 'BACKEND DEVELOPER' });
      const candidate = createMockCandidate({ profile: { targetRole: 'SOFTWARE DEVELOPER' } });
      
      const result = jobMatchEngine.calculateMatch(job, candidate);
      expect(result.roleMatch).toBe(60); // partial word match 'DEVELOPER'
    });

    it('should penalize completely unrelated roles', () => {
      const job = createMockJob({ title: 'MARKETING MANAGER' });
      const candidate = createMockCandidate({ profile: { targetRole: 'SOFTWARE ENGINEER' } });
      
      const result = jobMatchEngine.calculateMatch(job, candidate);
      expect(result.roleMatch).toBe(30);
    });
  });

  describe('3. Experience and Eligibility', () => {
    it('should flag INSUFFICIENT_DATA if experience is unknown and job requires it', () => {
      const job = createMockJob({ experienceMin: 3 });
      const candidate = createMockCandidate({ experienceMonths: undefined });
      
      const result = jobMatchEngine.calculateMatch(job, candidate);
      expect(result.warnings).toContain('CANDIDATE_EXPERIENCE_UNKNOWN');
    });

    it('should flag NOT_ELIGIBLE if experience falls short', () => {
      const job = createMockJob({ experienceMin: 3 }); // 3 years
      const candidate = createMockCandidate({ experienceMonths: 24 }); // 2 years
      
      const result = jobMatchEngine.calculateMatch(job, candidate);
      expect(result.eligibility).toBe('NOT_ELIGIBLE');
      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Experience shortfall')]));
    });

    it('should flag INSUFFICIENT_DATA for academic checks if grades missing', () => {
      const job = createMockJob();
      const candidate = createMockCandidate({ academics: { cgpa: undefined, percentage: undefined } });
      
      const result = jobMatchEngine.calculateMatch(job, candidate);
      expect(result.eligibility).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('4. Deterministic Output Constraints', () => {
    it('should compute final score rigidly (Req 60%, Pref 10%, Role 30%)', () => {
      const job = createMockJob({
        requiredSkills: ['REACT'], // 100% matched
        preferredSkills: ['DOCKER'], // 100% matched
        title: 'SOFTWARE ENGINEER' // partial role match (catalog id='software-engineer' != targetRole='SOFTWARE ENGINEER')
      });
      const candidate = createMockCandidate();
      
      const result = jobMatchEngine.calculateMatch(job, candidate);
      
      // requiredSkillScore=100, preferredSkillScore=100, roleScore=60 (partial word match, catalog id vs targetRole mismatch)
      // (100 * 0.6) + (100 * 0.1) + (60 * 0.3) = 60 + 10 + 18 = 88
      expect(result.score).toBe(88);
      expect(result.jobId).toBe('job-1');
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
});
