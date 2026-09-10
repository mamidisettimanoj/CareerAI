import { describe, it, expect } from 'vitest';
import { calculateSkillGaps } from '../engine/SkillGapEngine';
import { CareerIntelligenceInput } from '../types/intelligence.types';

describe('SkillGapEngine', () => {
  const baseInput: CareerIntelligenceInput = {
    academics: { cgpa: 7.0, sscPercentage: 70, hscPercentage: 70, activeBacklogs: 0 },
    skills: [],
    projects: [],
    resume: { hasResume: false },
    experience: { internshipsCount: 0, workExperienceMonths: 0 },
    assessments: {}
  };

  it('should return empty result when no target role', () => {
    const result = calculateSkillGaps(baseInput);
    expect(result.matchedSkills.length).toBe(0);
    expect(result.missingSkills.length).toBe(0);
  });

  it('should calculate missing skills correctly', () => {
    const input: CareerIntelligenceInput = {
      ...baseInput,
      targetRoleId: 'software-engineer',
      skills: [{ name: 'javascript', proficiency: 80 }, { name: 'react', proficiency: 80 }]
    };
    const result = calculateSkillGaps(input);
    expect(result.matchedSkills).toContain('JavaScript');
    expect(result.matchedSkills).toContain('React');
    expect(result.missingSkills).toContain('Data Structures & Algorithms');
    expect(result.missingSkills).toContain('SQL');
  });

  it('should detect skills implicitly via projects', () => {
    const input: CareerIntelligenceInput = {
      ...baseInput,
      targetRoleId: 'software-engineer',
      skills: [{ name: 'javascript', proficiency: 80 }],
      projects: [{ id: '1', name: 'P', description: 'desc', technologies: ['react', 'sql'], githubUrl: '', liveUrl: '' }]
    };
    const result = calculateSkillGaps(input);
    expect(result.weakSkills.map(w => w.skill)).toContain('React');
    expect(result.weakSkills.map(w => w.skill)).toContain('SQL');
  });
});
