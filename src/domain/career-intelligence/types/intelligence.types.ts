// src/domain/career-intelligence/types/intelligence.types.ts

import { AcademicIntelligenceResult } from '../../academic/types/academic.types';

// ---------------------------------------------------------
// DOMAIN INPUT MODEL
// ---------------------------------------------------------

export interface AcademicInput {
  cgpa: number;
  sscPercentage: number;
  hscPercentage: number;
  activeBacklogs: number;
  intelligence?: AcademicIntelligenceResult; // Added from Module 07
}

export interface SkillInput {
  name: string;
  proficiency?: number; // 0-100
}

export interface ProjectInput {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
}

import { ResumeIntelligenceResult } from '../../resume/types/resume.types';

export interface ResumeInput {
  hasResume: boolean;
  text?: string;
  intelligence?: ResumeIntelligenceResult;
}

export interface ExperienceInput {
  internshipsCount: number;
  workExperienceMonths: number;
}

export interface AssessmentInput {
  aptitudeScore?: number; // 0-100
  communicationScore?: number; // 0-100
  technicalScore?: number; // 0-100
}

export interface CareerIntelligenceInput {
  academics: AcademicInput;
  skills: SkillInput[];
  projects: ProjectInput[];
  resume: ResumeInput;
  experience: ExperienceInput;
  assessments: AssessmentInput;
  targetRoleId?: string; 
}

// ---------------------------------------------------------
// DOMAIN OUTPUT MODEL (Intelligence Result Contract)
// ---------------------------------------------------------

export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExplanationItem {
  area: string;
  reason: string;
  action: string;
  priority: PriorityLevel;
}

export interface DimensionScore {
  score: number;
  max: number;
  contribution: number;
  explanation: string;
  dataCompleteness: 'COMPLETE' | 'PARTIAL' | 'MISSING';
}

export interface ReadinessScore {
  overallScore: number;
  dimensions: {
    academic: DimensionScore;
    technical: DimensionScore;
    project: DimensionScore;
    resume: DimensionScore;
    aptitude: DimensionScore;
    interview: DimensionScore; // Communication + Technical
  };
  topStrengths: string[];
  priorityImprovements: ExplanationItem[];
}

export interface SkillGapAnalysis {
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: { skill: string; current: number; required: number }[];
}

export interface RoleMatchResult {
  roleId: string;
  roleName: string;
  matchScore: number; // 0-100
  skillGaps: SkillGapAnalysis;
  academicMatch: boolean;
  experienceMatch: boolean;
  recommendation: string;
}

export interface PlanDay {
  day: number;
  focus: string;
  task: string;
}

export interface RoadmapWeek {
  week: number;
  theme: string;
  goals: string[];
}

export type EligibilityStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'INSUFFICIENT_DATA';

export interface EligibilityResult {
  status: EligibilityStatus;
  companyPreset: string;
  checks: Record<string, boolean>; // e.g., { cgpa: true, backlogs: false }
}

export interface IntelligenceResult {
  version: string;
  timestamp: string;
  readiness: ReadinessScore;
  roleMatch?: RoleMatchResult;
  eligibility: EligibilityResult[];
  summary: string;
  sevenDayPlan: PlanDay[];
  thirtyDayRoadmap: RoadmapWeek[];
}
