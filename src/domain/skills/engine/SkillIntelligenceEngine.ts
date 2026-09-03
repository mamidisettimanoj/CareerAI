// src/domain/skills/engine/SkillIntelligenceEngine.ts

import { CandidateSkill, SkillIntelligenceResult, SkillEvidence } from '../types/skill.types';
import { normalizeSkillName } from './SkillNormalizer';

export interface RawSkillInput {
  name: string;
  category?: string;
  proficiency?: number;
}

export interface ProjectEvidenceInput {
  projectId: string;
  technologies: string[];
}

export function buildSkillIntelligence(
  rawSkills: RawSkillInput[],
  projects: ProjectEvidenceInput[]
): SkillIntelligenceResult {
  const skillMap = new Map<string, CandidateSkill>();

  // 1. Process explicit candidate skills
  for (const raw of rawSkills) {
    const normalizedName = normalizeSkillName(raw.name);
    if (!normalizedName) continue;

    let proficiencyScore = raw.proficiency ?? 0;
    
    // Ensure bound
    proficiencyScore = Math.max(0, Math.min(100, proficiencyScore));

    const skill: CandidateSkill = {
      name: raw.name, // Keep original optionally, or just use normalized
      normalizedName,
      category: (raw.category as any) || 'Other',
      proficiencyScore,
      proficiencyLevel: getProficiencyLevel(proficiencyScore),
      evidence: [
        { source: 'SELF_REPORTED', strength: proficiencyScore > 0 ? 'MEDIUM' : 'LOW' }
      ]
    };

    skillMap.set(normalizedName.toLowerCase(), skill);
  }

  // 2. Process project technologies as evidence
  for (const proj of projects) {
    for (const tech of proj.technologies) {
      const normalizedTech = normalizeSkillName(tech);
      if (!normalizedTech) continue;

      const key = normalizedTech.toLowerCase();
      const existing = skillMap.get(key);

      if (existing) {
        existing.evidence.push({
          source: 'PROJECT_EVIDENCE',
          referenceId: proj.projectId,
          strength: 'HIGH'
        });
      } else {
        // If product allows inferred skills, add it with 0 proficiency, just project evidence
        skillMap.set(key, {
          name: normalizedTech,
          normalizedName: normalizedTech,
          category: 'Other',
          proficiencyScore: 25, // Auto-assume beginner if project exists but not explicitly claimed?
          proficiencyLevel: 'BEGINNER',
          evidence: [
            { source: 'PROJECT_EVIDENCE', referenceId: proj.projectId, strength: 'MEDIUM' }
          ]
        });
      }
    }
  }

  const allSkills = Array.from(skillMap.values());
  const categories: Record<string, CandidateSkill[]> = {};
  
  for (const s of allSkills) {
    if (!categories[s.category]) {
      categories[s.category] = [];
    }
    categories[s.category].push(s);
  }

  const sortedSkills = [...allSkills].sort((a, b) => b.proficiencyScore - a.proficiencyScore);
  const strongestSkills = sortedSkills.filter(s => s.proficiencyScore >= 70);
  const weakestSkills = sortedSkills.filter(s => s.proficiencyScore < 40);

  let completeness: 'COMPLETE' | 'PARTIAL' | 'MISSING' = 'MISSING';
  if (allSkills.length > 5) completeness = 'COMPLETE';
  else if (allSkills.length > 0) completeness = 'PARTIAL';

  return {
    skills: allSkills,
    strongestSkills,
    weakestSkills,
    categories,
    completeness
  };
}

function getProficiencyLevel(score: number): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
  if (score >= 80) return 'EXPERT';
  if (score >= 60) return 'ADVANCED';
  if (score >= 40) return 'INTERMEDIATE';
  return 'BEGINNER';
}
