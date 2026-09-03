import { ResumeIntelligenceResult, ResumeCompleteness, ResumeSectionPresence, ProfileConsistency, ResumeEvidence } from '../types/resume.types';
import { normalizeSkillName } from '../../skills/engine/SkillNormalizer';
import { CareerIntelligenceInput } from '../../career-intelligence/types/intelligence.types';

export function analyzeResumeText(
  text: string, 
  profileData?: CareerIntelligenceInput
): ResumeIntelligenceResult {
  if (!text || text.trim().length === 0) {
    return {
      status: 'FAILED',
      completeness: 'MISSING',
      qualityScore: 0,
      sections: { education: false, experience: false, skills: false, projects: false, certifications: false, achievements: false, contact: false },
      evidence: [],
      warnings: ['Resume text is empty.'],
      missingSections: ['contact', 'education', 'skills', 'experience', 'projects'],
      wordCount: 0
    };
  }

  const normalizedText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // 1. Detect Sections
  const sections: ResumeSectionPresence = {
    education: /education|university|college|bachelor|degree/i.test(text),
    experience: /experience|employment|work history/i.test(text),
    skills: /skills|technologies|tools/i.test(text),
    projects: /projects|academic projects|personal projects/i.test(text),
    certifications: /certifications|certificates|courses/i.test(text),
    achievements: /achievements|awards|honors/i.test(text),
    contact: /email|phone|github|linkedin|\.com|@/i.test(text)
  };

  // 2. Extract Basic Evidence (Keywords)
  // This is a naive deterministic extractor
  const evidence: ResumeEvidence[] = [];
  
  const techKeywords = ['react', 'python', 'java', 'sql', 'javascript', 'c++', 'aws', 'docker', 'git', 'node.js', 'typescript'];
  techKeywords.forEach(kw => {
    if (normalizedText.includes(kw)) {
      evidence.push({
        type: 'SKILL',
        value: normalizeSkillName(kw) || kw,
        sourceSection: 'Skills',
        confidence: 'HIGH'
      });
    }
  });

  // 3. Completeness
  let completeness: ResumeCompleteness = 'MISSING';
  let qualityScore = 0;

  if (sections.contact) {
    completeness = 'MINIMAL';
    qualityScore += 10;
  }

  if (completeness === 'MINIMAL' && sections.education && sections.skills) {
    completeness = 'PARTIAL';
    qualityScore += 30; // 40 total
  }

  if (completeness === 'PARTIAL' && (sections.experience || sections.projects)) {
    completeness = 'COMPLETE';
    qualityScore += 30; // 70 total
  } else if (completeness === 'PARTIAL') {
    // Add points for just having one of them
    if (sections.experience) qualityScore += 15;
    if (sections.projects) qualityScore += 15;
  }

  // Bonus points for extras
  if (sections.certifications) qualityScore += 10;
  if (sections.achievements) qualityScore += 10;
  if (wordCount > 300) qualityScore += 10;

  qualityScore = Math.min(100, Math.max(0, qualityScore));

  const missingSections = Object.entries(sections)
    .filter(([_, present]) => !present)
    .map(([name]) => name);

  const warnings: string[] = [];
  if (wordCount < 100) warnings.push('Resume is very short. Provide more details.');
  if (wordCount > 1500) warnings.push('Resume is unusually long. Consider condensing.');
  if (!sections.contact) warnings.push('No contact information detected.');

  // 4. Profile Consistency (if profile provided)
  let consistency: ProfileConsistency | undefined;
  if (profileData) {
    consistency = checkProfileConsistency(evidence, profileData, normalizedText);
  }

  return {
    status: 'PROCESSED',
    completeness,
    qualityScore,
    sections,
    evidence,
    consistency,
    warnings,
    missingSections,
    wordCount
  };
}

function checkProfileConsistency(
  evidence: ResumeEvidence[], 
  profileData: CareerIntelligenceInput,
  normalizedResumeText: string
): ProfileConsistency {
  
  const resumeSkills = new Set(evidence.filter(e => e.type === 'SKILL').map(e => e.value.toLowerCase()));
  const profileSkills = new Set(profileData.skills.map(s => (normalizeSkillName(s.name) || s.name).toLowerCase()));

  const matchingSkills = Array.from(profileSkills).filter(s => resumeSkills.has(s));
  const extraResumeSkills = Array.from(resumeSkills).filter(s => !profileSkills.has(s));
  const profileSkillsNotInResume = Array.from(profileSkills).filter(s => !resumeSkills.has(s));

  const matchingProjects: string[] = [];
  const profileProjectsNotInResume: string[] = [];

  profileData.projects.forEach(p => {
    if (normalizedResumeText.includes(p.name.toLowerCase())) {
      matchingProjects.push(p.name);
    } else {
      profileProjectsNotInResume.push(p.name);
    }
  });

  return {
    matchingSkills,
    extraResumeSkills,
    profileSkillsNotInResume,
    matchingProjects,
    extraResumeProjects: [], // Hard to detect extra projects deterministically without NLP
    profileProjectsNotInResume,
    academicMatch: profileData.academics.cgpa > 0 && normalizedResumeText.includes(profileData.academics.cgpa.toString()) 
      ? 'CONSISTENT' 
      : 'UNKNOWN'
  };
}
