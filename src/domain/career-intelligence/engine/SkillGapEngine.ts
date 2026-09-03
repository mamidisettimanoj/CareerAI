// src/domain/career-intelligence/engine/SkillGapEngine.ts

import { CareerIntelligenceInput, SkillGapAnalysis } from '../types/intelligence.types';
import { getRoleDefinition } from '../config/roleCatalog';
import { normalizeSkillName } from '../../skills/engine/SkillNormalizer';
import { buildSkillIntelligence } from '../../skills/engine/SkillIntelligenceEngine';

export function calculateSkillGaps(input: CareerIntelligenceInput): SkillGapAnalysis {
  const defaultResult: SkillGapAnalysis = {
    matchedSkills: [],
    missingSkills: [],
    weakSkills: []
  };

  if (!input.targetRoleId) {
    return defaultResult;
  }

  const role = getRoleDefinition(input.targetRoleId);
  if (!role) {
    return defaultResult;
  }

  // 1. Process candidate skills using SkillIntelligenceEngine
  const skillIntel = buildSkillIntelligence(
    input.skills.map(s => ({ name: s.name, proficiency: s.proficiency })),
    input.projects.map(p => ({ projectId: p.id, technologies: p.technologies }))
  );

  const matched: string[] = [];
  const missing: string[] = [];
  const weak: { skill: string; current: number; required: number }[] = [];

  // Helper to check requirements
  const processRequirement = (reqSkillName: string, minProficiency: number) => {
    const normalizedReq = normalizeSkillName(reqSkillName).toLowerCase();
    
    // Find candidate skill
    const candidateSkill = skillIntel.skills.find(s => s.normalizedName.toLowerCase() === normalizedReq);

    if (candidateSkill) {
      if (candidateSkill.proficiencyScore >= minProficiency) {
        matched.push(reqSkillName);
      } else {
        weak.push({
          skill: reqSkillName,
          current: candidateSkill.proficiencyScore,
          required: minProficiency
        });
      }
    } else {
      missing.push(reqSkillName);
    }
  };

  // 2. Process required skills
  for (const req of role.requiredSkills) {
    processRequirement(req.skillName, req.minProficiency);
  }

  // 3. Process preferred skills
  for (const pref of role.preferredSkills) {
    processRequirement(pref.skillName, pref.minProficiency);
  }

  return {
    matchedSkills: matched,
    missingSkills: missing,
    weakSkills: weak
  };
}
