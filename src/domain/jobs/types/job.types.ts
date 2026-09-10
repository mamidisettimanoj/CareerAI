export enum JobFreshness {
  FRESH = 'FRESH',
  STALE = 'STALE',
  EXPIRED = 'EXPIRED',
  UNKNOWN = 'UNKNOWN'
}

export interface CanonicalJob {
  id: string;
  source: string;
  sourceJobId: string;
  title: string;
  companyName: string;
  location?: string;
  remoteType?: string;
  employmentType?: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  sourceUrl?: string;
  publishedAt?: Date;
  expiresAt?: Date;
  fetchedAt: Date;
  isActive: boolean;
  freshness: JobFreshness;
}

export interface JobSearchCriteria {
  keyword?: string;
  location?: string;
  remoteType?: string;
  limit?: number;
}

export enum SkillMatchType {
  MATCHED = 'MATCHED',
  MISSING = 'MISSING',
  WEAK = 'WEAK',
  UNKNOWN = 'UNKNOWN'
}

export interface JobMatchResult {
  jobId: string;
  score: number; // 0 - 100
  requiredSkillMatch: number; // 0 - 100
  preferredSkillMatch: number; // 0 - 100
  roleMatch: number; // 0 - 100
  eligibility: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'INSUFFICIENT_DATA';
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: string[];
  reasons: string[];
  warnings: string[];
}
