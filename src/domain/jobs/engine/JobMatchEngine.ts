import { CanonicalJob, JobMatchResult } from '../types/job.types';
import { normalizeSkillName } from '../../../domain/skills/engine/SkillNormalizer';
import { getRoleDefinition } from '../../../domain/career-intelligence/config/roleCatalog';
import { Profile, Skill } from '@prisma/client';

export interface CandidateContext {
  profile: Profile;
  skills: Skill[];
  academics: {
    cgpa?: number;
    percentage?: number;
    hasBacklogs?: boolean;
    activeBacklogs?: number;
  };
  experienceMonths?: number;
}

export class JobMatchEngine {
  public calculateMatch(job: CanonicalJob, candidate: CandidateContext): JobMatchResult {
    const reasons: string[] = [];
    const warnings: string[] = [];
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const weakSkills: string[] = [];

    let requiredSkillScore = 0;
    let preferredSkillScore = 0;
    let roleScore = 0;
    let eligibility: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'INSUFFICIENT_DATA' = 'ELIGIBLE';

    // 1. Skill Matching (Deterministic Normalization)
    const normalizedCandidateSkills = candidate.skills.map(s => normalizeSkillName(s.name));
    
    // Required Skills
    if (job.requiredSkills.length > 0) {
      let matchedReqCount = 0;
      for (const reqSkill of job.requiredSkills) {
        const normalizedReq = normalizeSkillName(reqSkill);
        
        // Find matching skill in candidate's profile
        const matched = candidate.skills.find(s => normalizeSkillName(s.name) === normalizedReq);
        
        if (matched) {
          matchedSkills.push(reqSkill);
          if (matched.proficiency >= 60) {
            matchedReqCount++;
            reasons.push(`Matched required skill: ${reqSkill}`);
          } else {
            weakSkills.push(reqSkill);
            matchedReqCount += 0.5; // partial credit
            reasons.push(`Weak match on required skill: ${reqSkill} (Proficiency: ${matched.proficiency}%)`);
          }
        } else {
          missingSkills.push(reqSkill);
          reasons.push(`Missing required skill: ${reqSkill}`);
        }
      }
      requiredSkillScore = (matchedReqCount / job.requiredSkills.length) * 100;
    } else {
      requiredSkillScore = 100; // No requirements = automatic pass on this vector
    }

    // Preferred Skills
    if (job.preferredSkills.length > 0) {
      let matchedPrefCount = 0;
      for (const prefSkill of job.preferredSkills) {
        const normalizedPref = normalizeSkillName(prefSkill);
        if (normalizedCandidateSkills.includes(normalizedPref)) {
          matchedPrefCount++;
          matchedSkills.push(prefSkill);
        }
      }
      preferredSkillScore = (matchedPrefCount / job.preferredSkills.length) * 100;
      if (preferredSkillScore > 0) {
        reasons.push(`Matched ${matchedPrefCount} preferred skills.`);
      }
    } else {
      preferredSkillScore = 100;
    }

    // 2. Role Matching
    if (candidate.profile.targetRole && job.title) {
      const canonicalRole = getRoleDefinition(job.title);
      if (canonicalRole && canonicalRole.id === candidate.profile.targetRole) {
        roleScore = 100;
        reasons.push(`Strong role alignment: Target role '${candidate.profile.targetRole}' matches Job Title '${job.title}'.`);
      } else {
        const titleWords = job.title.toLowerCase().split(' ');
        const targetWords = candidate.profile.targetRole.toLowerCase().split(' ');
        const intersect = titleWords.filter(w => targetWords.includes(w));
        
        if (intersect.length > 0) {
          roleScore = 60;
          reasons.push(`Partial role alignment: Target role '${candidate.profile.targetRole}' partially matches Job Title '${job.title}'.`);
        } else {
          roleScore = 30;
          reasons.push(`Low role alignment: Target role '${candidate.profile.targetRole}' differs from Job Title '${job.title}'.`);
        }
      }
    } else {
      roleScore = 50; // Neutral if unknown
      warnings.push("Role Match Unknown: Candidate target role or job title missing.");
    }

    // 3. Experience Match
    if (job.experienceMin !== undefined || job.experienceMax !== undefined) {
      if (candidate.experienceMonths === undefined) {
        warnings.push('CANDIDATE_EXPERIENCE_UNKNOWN');
        eligibility = 'INSUFFICIENT_DATA';
      } else {
        const expMonths = candidate.experienceMonths;
        const expYears = expMonths / 12;

        if (job.experienceMin !== undefined && expYears < job.experienceMin) {
          warnings.push(`Experience shortfall: Job requires ${job.experienceMin} years, candidate has ${(expYears).toFixed(1)} years.`);
          eligibility = 'NOT_ELIGIBLE'; // Hard blocker typically
        } else if (job.experienceMax !== undefined && expYears > job.experienceMax) {
          warnings.push(`Overqualified: Job maximum is ${job.experienceMax} years.`);
        } else {
          reasons.push(`Experience requirements met.`);
        }
      }
    } else {
      if (candidate.experienceMonths === undefined) {
        warnings.push('CANDIDATE_EXPERIENCE_UNKNOWN');
      }
    }

    // 4. Academic/Eligibility Checks
    // Assuming simple check for backlogs if the job criteria was present (we map loosely here)
    if (candidate.academics.activeBacklogs && candidate.academics.activeBacklogs > 0) {
      warnings.push(`Candidate has ${candidate.academics.activeBacklogs} active backlogs, which may violate eligibility criteria.`);
    }
    
    if (candidate.academics.percentage === undefined && candidate.academics.cgpa === undefined) {
      eligibility = 'INSUFFICIENT_DATA';
      warnings.push("Insufficient academic data to evaluate strict eligibility.");
    }

    // 5. Final Score Calculation (Deterministic Formula)
    // Weights: Required Skills (60%), Preferred Skills (10%), Role Match (30%)
    // This is entirely separate from Career Readiness Score.
    const finalScore = Math.round((requiredSkillScore * 0.6) + (preferredSkillScore * 0.1) + (roleScore * 0.3));

    return {
      jobId: job.id,
      score: finalScore,
      requiredSkillMatch: requiredSkillScore,
      preferredSkillMatch: preferredSkillScore,
      roleMatch: roleScore,
      eligibility,
      matchedSkills: Array.from(new Set(matchedSkills)),
      missingSkills: Array.from(new Set(missingSkills)),
      weakSkills: Array.from(new Set(weakSkills)),
      reasons,
      warnings
    };
  }
}

export const jobMatchEngine = new JobMatchEngine();
