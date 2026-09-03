import { describe, it, expect } from 'vitest';
import { calculateReadiness } from '../engine/ReadinessEngine';
import { CareerIntelligenceInput } from '../types/intelligence.types';

describe('ReadinessEngine', () => {
  const baseInput: CareerIntelligenceInput = {
    academics: { cgpa: 8.0, sscPercentage: 80, hscPercentage: 80, activeBacklogs: 0 },
    skills: [{ name: 'react' }, { name: 'java' }],
    projects: [{ id: '1', name: 'Project', description: 'Desc', technologies: ['React'], githubUrl: 'https://github', liveUrl: 'https://live' }],
    resume: { hasResume: true, text: 'education project skills' },
    experience: { internshipsCount: 1, workExperienceMonths: 0 },
    assessments: { aptitudeScore: 80, technicalScore: 85, communicationScore: 80 }
  };

  it('should calculate a high readiness score for a strong profile', () => {
    const result = calculateReadiness(baseInput);
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.dimensions.academic.dataCompleteness).toBe('COMPLETE');
    expect(result.priorityImprovements.length).toBe(0);
  });

  it('should penalize backlogs heavily', () => {
    const input: CareerIntelligenceInput = {
      ...baseInput,
      academics: { ...baseInput.academics, activeBacklogs: 2 }
    };
    const result = calculateReadiness(input);
    expect(result.dimensions.academic.score).toBeLessThan(80); // 80 - 20 = 60
    expect(result.priorityImprovements.some(p => p.area === 'Academic')).toBe(true);
  });

  it('should handle missing data gracefully', () => {
    const emptyInput: CareerIntelligenceInput = {
      academics: { cgpa: 0, sscPercentage: 0, hscPercentage: 0, activeBacklogs: 0 },
      skills: [],
      projects: [],
      resume: { hasResume: false },
      experience: { internshipsCount: 0, workExperienceMonths: 0 },
      assessments: {}
    };
    const result = calculateReadiness(emptyInput);
    expect(result.overallScore).toBe(0);
    expect(result.dimensions.academic.dataCompleteness).toBe('MISSING');
    expect(result.dimensions.technical.dataCompleteness).toBe('MISSING');
    expect(result.priorityImprovements.length).toBeGreaterThan(0);
  });
});
