import { describe, it, expect } from 'vitest';
import { calculateRoleMatch } from '../engine/RoleMatchEngine';
import { CareerIntelligenceInput } from '../types/intelligence.types';

describe('RoleMatchEngine', () => {
  const baseInput: CareerIntelligenceInput = {
    academics: { cgpa: 7.5, sscPercentage: 70, hscPercentage: 70, activeBacklogs: 0 },
    skills: [],
    projects: [],
    resume: { hasResume: false },
    experience: { internshipsCount: 0, workExperienceMonths: 0 },
    assessments: {},
    targetRoleId: 'software-engineer'
  };

  it('should return undefined if no role specified', () => {
    const input = { ...baseInput, targetRoleId: undefined };
    expect(calculateRoleMatch(input)).toBeUndefined();
  });

  it('should calculate match score accurately for missing skills', () => {
    const input: CareerIntelligenceInput = {
      ...baseInput,
      skills: [{ name: 'react', proficiency: 60 }, { name: 'javascript', proficiency: 60 }]
    };
    const result = calculateRoleMatch(input);
    expect(result).toBeDefined();
    expect(result!.academicMatch).toBe(true);
    expect(result!.experienceMatch).toBe(false);
    expect(result!.matchScore).toBeLessThan(100);
    expect(result!.matchScore).toBeGreaterThan(0); 
  });

  it('should calculate perfect match', () => {
    const input: CareerIntelligenceInput = {
      ...baseInput,
      skills: [
        { name: 'Data Structures & Algorithms', proficiency: 90 }, 
        { name: 'JavaScript', proficiency: 90 }, 
        { name: 'React', proficiency: 90 }, 
        { name: 'SQL', proficiency: 90 },
        { name: 'Node.js', proficiency: 90 },
        { name: 'Docker', proficiency: 90 },
        { name: 'AWS', proficiency: 90 },
        { name: 'Git', proficiency: 90 }
      ],
      experience: { internshipsCount: 1, workExperienceMonths: 0 }
    };
    const result = calculateRoleMatch(input);
    expect(result!.matchScore).toBe(100);
    expect(result!.academicMatch).toBe(true);
    expect(result!.experienceMatch).toBe(true);
  });
});
