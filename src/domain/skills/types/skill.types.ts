// src/domain/skills/types/skill.types.ts

export type SkillProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type SkillCategory = 
  | 'Programming Languages' 
  | 'Frameworks' 
  | 'Databases' 
  | 'Cloud' 
  | 'DevOps' 
  | 'Tools' 
  | 'Data/ML' 
  | 'Web' 
  | 'Mobile' 
  | 'Soft Skills'
  | 'Other';

export type SkillEvidenceSource = 'SELF_REPORTED' | 'PROJECT_EVIDENCE' | 'ASSESSMENT_VERIFIED' | 'OTHER';

export interface SkillEvidence {
  source: SkillEvidenceSource;
  referenceId?: string;
  strength: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CandidateSkill {
  id?: string;
  name: string;
  normalizedName: string;
  category: SkillCategory;
  proficiencyScore: number; // 0-100
  proficiencyLevel: SkillProficiencyLevel;
  evidence: SkillEvidence[];
}

export interface SkillIntelligenceResult {
  skills: CandidateSkill[];
  strongestSkills: CandidateSkill[];
  weakestSkills: CandidateSkill[];
  categories: Record<string, CandidateSkill[]>;
  completeness: 'COMPLETE' | 'PARTIAL' | 'MISSING';
}

// Map score to level
export function getProficiencyLevel(score: number): SkillProficiencyLevel {
  if (score >= 80) return 'EXPERT';
  if (score >= 60) return 'ADVANCED';
  if (score >= 40) return 'INTERMEDIATE';
  return 'BEGINNER';
}

// Map level to score
export function getProficiencyScore(level: SkillProficiencyLevel): number {
  switch (level) {
    case 'EXPERT': return 90;
    case 'ADVANCED': return 70;
    case 'INTERMEDIATE': return 50;
    case 'BEGINNER': return 25;
    default: return 0;
  }
}
