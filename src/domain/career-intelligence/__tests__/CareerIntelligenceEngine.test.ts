import { describe, it, expect } from 'vitest';
import { analyzeCareerProfile } from '../engine/CareerIntelligenceEngine';
import { CareerIntelligenceInput } from '../types/intelligence.types';
import { ENGINE_CONFIG } from '../config/engineConfig';

describe('CareerIntelligenceEngine', () => {
  it('should orchestrate all engines and return an IntelligenceResult', () => {
    const input: CareerIntelligenceInput = {
      academics: { cgpa: 8.0, sscPercentage: 80, hscPercentage: 80, activeBacklogs: 0 },
      skills: [{ name: 'react' }, { name: 'java' }],
      projects: [],
      resume: { hasResume: true, text: 'education project skills' },
      experience: { internshipsCount: 0, workExperienceMonths: 0 },
      assessments: {},
      targetRoleId: 'software-engineer'
    };

    const result = analyzeCareerProfile(input);
    expect(result.version).toBe(ENGINE_CONFIG.version);
    expect(result.readiness).toBeDefined();
    expect(result.roleMatch).toBeDefined();
    expect(result.eligibility).toBeDefined();
    expect(result.timestamp).toBeDefined();
    
    // Ensure determinism
    const result2 = analyzeCareerProfile(input);
    expect(result.readiness.overallScore).toBe(result2.readiness.overallScore);
  });
});
