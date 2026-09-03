import { describe, it, expect } from 'vitest';
import { applicationTransitionEngine } from '../engine/ApplicationStatusTransitionEngine';
import { ApplicationStatus } from '@prisma/client';

describe('ApplicationStatusTransitionEngine', () => {
  describe('Domain: valid status transition', () => {
    it('allows APPLIED -> SCREENING', () => {
      const result = applicationTransitionEngine.validateTransition(ApplicationStatus.APPLIED, ApplicationStatus.SCREENING);
      expect(result.valid).toBe(true);
    });

    it('allows SCREENING -> ASSESSMENT', () => {
      expect(applicationTransitionEngine.validateTransition(ApplicationStatus.SCREENING, ApplicationStatus.ASSESSMENT).valid).toBe(true);
    });

    it('allows ASSESSMENT -> INTERVIEW', () => {
      expect(applicationTransitionEngine.validateTransition(ApplicationStatus.ASSESSMENT, ApplicationStatus.INTERVIEW).valid).toBe(true);
    });

    it('allows INTERVIEW -> OFFER', () => {
      expect(applicationTransitionEngine.validateTransition(ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER).valid).toBe(true);
    });

    it('allows active -> REJECTED', () => {
      expect(applicationTransitionEngine.validateTransition(ApplicationStatus.APPLIED, ApplicationStatus.REJECTED).valid).toBe(true);
      expect(applicationTransitionEngine.validateTransition(ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED).valid).toBe(true);
    });

    it('allows active -> WITHDRAWN', () => {
      expect(applicationTransitionEngine.validateTransition(ApplicationStatus.APPLIED, ApplicationStatus.WITHDRAWN).valid).toBe(true);
    });
  });

  describe('Domain: invalid status transition', () => {
    it('blocks REJECTED -> INTERVIEW (reopening blocked)', () => {
      const result = applicationTransitionEngine.validateTransition(ApplicationStatus.REJECTED, ApplicationStatus.INTERVIEW);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid transition');
    });

    it('blocks WITHDRAWN -> OFFER', () => {
      const result = applicationTransitionEngine.validateTransition(ApplicationStatus.WITHDRAWN, ApplicationStatus.OFFER);
      expect(result.valid).toBe(false);
    });

    it('blocks transition to same state', () => {
      const result = applicationTransitionEngine.validateTransition(ApplicationStatus.APPLIED, ApplicationStatus.APPLIED);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Already in this status');
    });
  });
});
