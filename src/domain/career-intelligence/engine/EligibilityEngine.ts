// src/domain/career-intelligence/engine/EligibilityEngine.ts

import { CareerIntelligenceInput, EligibilityResult, EligibilityStatus } from '../types/intelligence.types';

export interface EligibilityCriteria {
  presetName: string;
  minCgpa: number;
  minSsc: number;
  minHsc: number;
  maxBacklogs: number;
  minInternships: number;
}

export const PRESETS: EligibilityCriteria[] = [
  { presetName: "Standard Tech (TCS/Wipro)", minCgpa: 6.0, minSsc: 60, minHsc: 60, maxBacklogs: 1, minInternships: 0 },
  { presetName: "Product Based (Amazon/MS)", minCgpa: 7.5, minSsc: 70, minHsc: 70, maxBacklogs: 0, minInternships: 1 },
  { presetName: "Startup / High Growth", minCgpa: 0, minSsc: 0, minHsc: 0, maxBacklogs: 99, minInternships: 2 }
];

export function calculateEligibility(input: CareerIntelligenceInput, customPresets?: EligibilityCriteria[]): EligibilityResult[] {
  const presetsToUse = customPresets || PRESETS;

  // Check if we have minimum required data
  if (input.academics.cgpa === 0 && input.academics.sscPercentage === 0) {
    return presetsToUse.map(p => ({
      status: 'INSUFFICIENT_DATA',
      companyPreset: p.presetName,
      checks: {}
    }));
  }

  return presetsToUse.map(criteria => {
    const checks = {
      cgpa: input.academics.cgpa >= criteria.minCgpa,
      ssc: input.academics.sscPercentage >= criteria.minSsc,
      hsc: input.academics.hscPercentage >= criteria.minHsc,
      backlogs: input.academics.activeBacklogs <= criteria.maxBacklogs,
      experience: input.experience.internshipsCount >= criteria.minInternships || input.projects.length >= 2
    };

    const isEligible = Object.values(checks).every(Boolean);

    return {
      status: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      companyPreset: criteria.presetName,
      checks
    };
  });
}
