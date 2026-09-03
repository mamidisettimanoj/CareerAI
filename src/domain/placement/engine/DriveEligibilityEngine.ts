import { Profile, Education, Skill, DriveEligibilityRule } from '@prisma/client';

export type EligibilityResultType = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'INSUFFICIENT_DATA';

export interface EligibilityResult {
  status: EligibilityResultType;
  reasons: string[];
}

export interface StudentContext {
  profile: Profile;
  education: Education[];
  skills: Skill[];
}

export class DriveEligibilityEngine {
  /**
   * Evaluates student eligibility against configured institutional drive rules.
   * This is entirely deterministic and relies on authoritative database data.
   */
  evaluate(student: StudentContext, rule: DriveEligibilityRule | null): EligibilityResult {
    if (!rule) {
      return { status: 'ELIGIBLE', reasons: ['No strict eligibility rules configured.'] };
    }

    const reasons: string[] = [];
    let isEligible = true;
    let hasInsufficientData = false;

    // We typically look at the most recent/highest education, or check all active. 
    // Let's assume we take the primary degree (e.g., endYear >= currentYear).
    // For safety, we check if ANY education record meets the criteria, or if ALL fail.
    const latestEdu = student.education.sort((a, b) => b.endYear - a.endYear)[0];

    if (!latestEdu) {
      return { status: 'INSUFFICIENT_DATA', reasons: ['No educational records found.'] };
    }

    // 1. CGPA Check
    if (rule.minCgpa !== null) {
      if (latestEdu.cgpa === null) {
        hasInsufficientData = true;
        reasons.push('Missing CGPA data.');
      } else if (latestEdu.cgpa < rule.minCgpa) {
        isEligible = false;
        reasons.push(`CGPA ${latestEdu.cgpa} is below the required ${rule.minCgpa}.`);
      } else {
        reasons.push(`CGPA ${latestEdu.cgpa} meets requirement (>= ${rule.minCgpa}).`);
      }
    }

    // 2. Active Backlogs Check
    if (rule.maxActiveBacklogs !== null) {
      if (latestEdu.activeBacklogs > rule.maxActiveBacklogs) {
        isEligible = false;
        reasons.push(`Active backlogs (${latestEdu.activeBacklogs}) exceed the allowed maximum (${rule.maxActiveBacklogs}).`);
      } else {
        reasons.push(`Active backlogs (${latestEdu.activeBacklogs}) within allowed limit (<= ${rule.maxActiveBacklogs}).`);
      }
    }

    // 3. Graduation Year Check
    if (rule.graduationYears.length > 0) {
      if (!rule.graduationYears.includes(latestEdu.endYear)) {
        isEligible = false;
        reasons.push(`Graduation year ${latestEdu.endYear} is not allowed. (Allowed: ${rule.graduationYears.join(', ')})`);
      } else {
        reasons.push(`Graduation year ${latestEdu.endYear} is eligible.`);
      }
    }

    // 4. Branch Check
    if (rule.allowedBranches.length > 0) {
      if (!latestEdu.branch) {
        hasInsufficientData = true;
        reasons.push('Missing Branch/Program data.');
      } else {
        const matchesBranch = rule.allowedBranches.some(b => latestEdu.branch?.toLowerCase().includes(b.toLowerCase()));
        if (!matchesBranch) {
          isEligible = false;
          reasons.push(`Branch '${latestEdu.branch}' is not in the allowed list.`);
        } else {
          reasons.push(`Branch '${latestEdu.branch}' is allowed.`);
        }
      }
    }

    // 5. Required Skills Check
    if (rule.requiredSkills.length > 0) {
      const studentSkillNames = student.skills.map(s => s.name.toLowerCase());
      const missingSkills = rule.requiredSkills.filter(req => !studentSkillNames.includes(req.toLowerCase()));
      
      if (missingSkills.length > 0) {
        isEligible = false;
        reasons.push(`Missing required skills: ${missingSkills.join(', ')}.`);
      } else {
        reasons.push(`All required skills are met.`);
      }
    }

    if (hasInsufficientData && isEligible) {
      // If we are otherwise eligible but missing critical data, we cannot confirm eligibility.
      return { status: 'INSUFFICIENT_DATA', reasons };
    }

    return {
      status: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      reasons
    };
  }
}

export const driveEligibilityEngine = new DriveEligibilityEngine();
