import { describe, it, expect } from 'vitest';
import { calculateEligibility } from '../engine/EligibilityEngine';
import { CareerIntelligenceInput } from '../types/intelligence.types';

describe('EligibilityEngine', () => {
  const baseInput: CareerIntelligenceInput = {
    academics: { cgpa: 0, sscPercentage: 0, hscPercentage: 0, activeBacklogs: 0 },
    skills: [],
    projects: [],
    resume: { hasResume: false },
    experience: { internshipsCount: 0, workExperienceMonths: 0 },
    assessments: {}
  };

  it('should return INSUFFICIENT_DATA when missing academic details', () => {
    const result = calculateEligibility(baseInput);
    expect(result[0].status).toBe('INSUFFICIENT_DATA');
  });

  it('should return ELIGIBLE for standard preset when meeting criteria', () => {
    const input: CareerIntelligenceInput = {
      ...baseInput,
      academics: { cgpa: 7.0, sscPercentage: 70, hscPercentage: 70, activeBacklogs: 0 },
      experience: { internshipsCount: 1, workExperienceMonths: 0 }
    };
    const result = calculateEligibility(input);
    const standardPreset = result.find(r => r.companyPreset === "Standard Tech (TCS/Wipro)");
    expect(standardPreset?.status).toBe('ELIGIBLE');
  });

  it('should return NOT_ELIGIBLE when backlogs exceed limit', () => {
    const input: CareerIntelligenceInput = {
      ...baseInput,
      academics: { cgpa: 7.0, sscPercentage: 70, hscPercentage: 70, activeBacklogs: 2 }
    };
    const result = calculateEligibility(input);
    const standardPreset = result.find(r => r.companyPreset === "Standard Tech (TCS/Wipro)");
    expect(standardPreset?.status).toBe('NOT_ELIGIBLE');
  });
});
