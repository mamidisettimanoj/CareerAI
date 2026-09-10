import { UserProfile, ProjectData, CertificationData } from '@/types';
import { InternshipData, AchievementData, ResumeVersion } from '../types/portfolio.types';
import { analyzeProjectPortfolio } from '../../projects/engine/ProjectIntelligenceEngine';

export interface PortfolioCompletenessResult {
  score: number; // 0-100
  missingItems: string[];
  recommendations: string[];
}

export function calculatePortfolioCompleteness(
  profile: UserProfile | null,
  projects: ProjectData[],
  internships: InternshipData[],
  certifications: CertificationData[],
  achievements: AchievementData[],
  resumeVersions: ResumeVersion[]
): PortfolioCompletenessResult {
  let score = 0;
  const missingItems: string[] = [];
  const recommendations: string[] = [];

  // 1. Projects Analysis (max 40)
  const projectInputs = projects.map(p => ({
    id: p.id,
    name: p.title || p.name || 'Untitled',
    description: p.description || '',
    technologies: p.technologies || (p.technology ? [p.technology] : []),
    githubUrl: p.githubUrl,
    liveUrl: p.demoUrl || p.liveUrl
  }));
  const projectIntel = analyzeProjectPortfolio(projectInputs);
  
  if (projectIntel.overallQuality > 0) {
    // scale 0-100 to 0-40
    score += (projectIntel.overallQuality / 100) * 40;
  }
  
  if (projects.length < 2) {
    missingItems.push('At least 2 strong projects');
    recommendations.push('Add more projects to demonstrate your skills.');
  }
  if (projectIntel.deployedProjects === 0) {
    recommendations.push('Deploy at least one project live to show practical execution.');
  }

  // 2. Internships (max 20)
  const completedInternships = internships.filter(i => i.status === 'Completed' || i.status === 'Ongoing');
  if (completedInternships.length > 0) {
    score += 20; // 20 points for having internship experience
  } else {
    missingItems.push('Internship experience');
    recommendations.push('Apply for internships to gain professional experience.');
  }

  // 3. Certifications & Achievements (max 15)
  let extraScore = 0;
  if (certifications.filter(c => c.status !== 'Expired').length > 0) {
    extraScore += 10;
  } else {
    recommendations.push('Complete industry-recognized certifications to validate your skills.');
  }
  
  if (achievements.length > 0) {
    extraScore += 5;
  } else {
    recommendations.push('Add achievements like hackathons or coding contests to stand out.');
  }
  score += Math.min(15, extraScore);

  // 4. Links & Profile (max 10)
  let linksScore = 0;
  if (profile?.links?.github) linksScore += 5;
  else missingItems.push('GitHub profile link');
  
  if (profile?.links?.linkedin) linksScore += 5;
  else missingItems.push('LinkedIn profile link');
  
  score += linksScore;

  // 5. Resume (max 15)
  if (resumeVersions.length > 0) {
    score += 15;
  } else {
    missingItems.push('Resume');
    recommendations.push('Build a resume in the Resume Studio.');
  }

  return {
    score: Math.min(100, Math.round(score)),
    missingItems,
    recommendations
  };
}
