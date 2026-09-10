// src/domain/career-intelligence/engine/RoleMatchEngine.ts

import { CareerIntelligenceInput, RoleMatchResult } from '../types/intelligence.types';
import { getRoleDefinition } from '../config/roleCatalog';
import { calculateSkillGaps } from './SkillGapEngine';

export function calculateRoleMatch(input: CareerIntelligenceInput): RoleMatchResult | undefined {
  if (!input.targetRoleId) return undefined;

  const role = getRoleDefinition(input.targetRoleId);
  if (!role) return undefined;

  const skillGaps = calculateSkillGaps(input);
  
  // 1. Skill Match Score (Max 60 points)
  // Deterministic formula: 
  // - Required skills account for 80% of the skill score (48 points max).
  // - Preferred skills account for 20% of the skill score (12 points max).
  // - Weak skills give half credit.
  
  let requiredScore = 0;
  if (role.requiredSkills.length > 0) {
    let earned = 0;
    for (const req of role.requiredSkills) {
      if (skillGaps.matchedSkills.includes(req.skillName)) {
        earned += 1;
      } else if (skillGaps.weakSkills.some(w => w.skill === req.skillName)) {
        earned += 0.5;
      }
    }
    requiredScore = (earned / role.requiredSkills.length) * 48;
  } else {
    requiredScore = 48; // Give full points if no required skills are defined
  }

  let preferredScore = 0;
  if (role.preferredSkills.length > 0) {
    let earned = 0;
    for (const pref of role.preferredSkills) {
      if (skillGaps.matchedSkills.includes(pref.skillName)) {
        earned += 1;
      } else if (skillGaps.weakSkills.some(w => w.skill === pref.skillName)) {
        earned += 0.5;
      }
    }
    preferredScore = (earned / role.preferredSkills.length) * 12;
  } else {
    preferredScore = 12; // Give full points if no preferred skills are defined
  }

  const skillScore = requiredScore + preferredScore;

  // 2. Academic Match (Max 20 points)
  const academicMatch = input.academics.cgpa >= role.minCgpa;
  const academicScore = academicMatch ? 20 : 0;

  // 3. Experience Match (Max 20 points)
  const hasExperience = input.experience.internshipsCount >= 1 || input.projects.length >= 1;
  const experienceScore = hasExperience ? 20 : 0;

  let matchScore = Math.round(skillScore + academicScore + experienceScore);
  
  // Clamp between 0 and 100
  matchScore = Math.max(0, Math.min(100, matchScore));

  let recommendation = "";
  if (matchScore >= 80) recommendation = `Strong match for ${role.displayName}. Focus on interview prep.`;
  else if (matchScore >= 50) recommendation = `Moderate match. Address the skill gaps in: ${skillGaps.missingSkills.slice(0,2).join(', ')}.`;
  else recommendation = `Low match. Start by building foundational skills for ${role.displayName}.`;

  return {
    roleId: role.id,
    roleName: role.displayName,
    matchScore,
    skillGaps,
    academicMatch,
    experienceMatch: hasExperience,
    recommendation
  };
}
