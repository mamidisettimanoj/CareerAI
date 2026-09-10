import { UserProfile } from '@/types';
import { EligibilityRule } from '@/data/placement/eligibility-rules';

export interface EligibilityResult {
  status: 'ELIGIBLE' | 'CONDITIONAL' | 'NOT_ELIGIBLE';
  reasons: string[];
}

export function checkEligibility(profile: UserProfile, rule: EligibilityRule): EligibilityResult {
  const reasons: string[] = [];
  let status: 'ELIGIBLE' | 'CONDITIONAL' | 'NOT_ELIGIBLE' = 'ELIGIBLE';

  // CGPA Check
  if (profile.degree.cgpa < rule.minCgpa) {
    status = 'NOT_ELIGIBLE';
    reasons.push(`CGPA (${profile.degree.cgpa}) is below required minimum (${rule.minCgpa}).`);
  }

  // Active Backlogs Check
  if (profile.degree.backlogs > rule.maxActiveBacklogs) {
    status = 'NOT_ELIGIBLE';
    reasons.push(`Active backlogs (${profile.degree.backlogs}) exceed allowed maximum (${rule.maxActiveBacklogs}).`);
  }

  // SSC Check
  if (profile.personal.sscPercentage < rule.minSscPercentage) {
    status = 'NOT_ELIGIBLE';
    reasons.push(`10th / SSC percentage (${profile.personal.sscPercentage}%) is below required minimum (${rule.minSscPercentage}%).`);
  }

  // HSC Check
  if (profile.hsc.percentage < rule.minHscPercentage) {
    status = 'NOT_ELIGIBLE';
    reasons.push(`12th / HSC / Diploma percentage (${profile.hsc.percentage}%) is below required minimum (${rule.minHscPercentage}%).`);
  }

  // Branch Check (assuming profile.degree.branch holds string matching allowedBranches)
  if (!rule.allowedBranches.includes('ALL')) {
    const branchMatch = rule.allowedBranches.find(b => b.toLowerCase() === profile.degree.branch?.toLowerCase());
    if (!branchMatch) {
      status = 'NOT_ELIGIBLE';
      reasons.push(`Your branch (${profile.degree.branch || 'Not Specified'}) is not in the allowed list: ${rule.allowedBranches.join(', ')}.`);
    }
  }

  // Conditional Logic (e.g. they meet minimum but have a warning)
  if (status === 'ELIGIBLE') {
    if (profile.degree.cgpa < rule.minCgpa + 0.5) {
      status = 'CONDITIONAL';
      reasons.push(`Borderline eligible. Ensure CGPA does not drop below ${rule.minCgpa}.`);
    }
  }

  if (reasons.length === 0) {
    reasons.push('Meets all primary eligibility criteria.');
  }

  return { status, reasons };
}
