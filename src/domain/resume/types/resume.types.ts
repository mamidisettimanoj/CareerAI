export type ResumeCompleteness = 'MISSING' | 'MINIMAL' | 'PARTIAL' | 'COMPLETE';
export type ResumeStatus = 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'UNSUPPORTED_FORMAT';

export interface ResumeSectionPresence {
  education: boolean;
  experience: boolean;
  skills: boolean;
  projects: boolean;
  certifications: boolean;
  achievements: boolean;
  contact: boolean;
}

export interface ResumeEvidence {
  type: 'SKILL' | 'PROJECT' | 'EDUCATION' | 'EXPERIENCE' | 'CERTIFICATION' | 'ACHIEVEMENT';
  value: string;
  sourceSection: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ProfileConsistency {
  matchingSkills: string[];
  extraResumeSkills: string[];
  profileSkillsNotInResume: string[];
  
  matchingProjects: string[];
  extraResumeProjects: string[];
  profileProjectsNotInResume: string[];

  academicMatch: 'CONSISTENT' | 'POSSIBLE_MISMATCH' | 'UNKNOWN';
}

export interface ResumeIntelligenceResult {
  status: ResumeStatus;
  completeness: ResumeCompleteness;
  qualityScore: number; // 0-100
  sections: ResumeSectionPresence;
  evidence: ResumeEvidence[];
  consistency?: ProfileConsistency;
  warnings: string[];
  missingSections: string[];
  wordCount: number;
}
