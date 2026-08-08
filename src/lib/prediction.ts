import { UserProfile } from '../types';

// The prediction is a deterministic scoring formula for educational purposes.
export const calculatePlacementScore = (profile: UserProfile) => {
  let score = 0;
  
  // 1. Degree Performance (25% max)
  const cgpaPercentage = (profile.degree.cgpa / 10) * 100;
  score += (cgpaPercentage * 0.25);
  
  // Backlog penalty
  const backlogPenalty = profile.degree.backlogs * 2;
  score -= backlogPenalty;

  // 2. Aptitude & Employability (20% max)
  score += (profile.skills.employabilityScore * 0.20);
  
  // 3. Technical Skills (15% max - adjusted from 3% to make it meaningful)
  score += (profile.skills.technicalScore * 0.15);

  // 4. Communication (10% max)
  score += (profile.skills.communicationScore * 0.10);

  // 5. MBA Performance (if applicable, else distributed) (10% max)
  if (profile.mba.percentage > 0) {
    score += (profile.mba.percentage * 0.10);
  } else {
    // distribute to degree if no MBA
    score += (cgpaPercentage * 0.10);
  }

  // 6. Work Experience & Internships (10% max)
  const expScore = Math.min((profile.degree.workExperience * 1) + (profile.degree.internships * 3), 100);
  score += (expScore * 0.10);

  // 7. Projects & Certifications (10% max)
  const projCertScore = Math.min((profile.skills.projectsCount * 20) + (profile.skills.certificationsCount * 10), 100);
  score += (projCertScore * 0.10);
  
  // Normalize score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine Category
  let category = 'Needs Improvement';
  if (score >= 90) category = 'Excellent';
  else if (score >= 75) category = 'Strong';
  else if (score >= 60) category = 'Moderate';

  return {
    score: Math.round(score),
    category
  };
};

export const generateRecommendations = (profile: UserProfile, score: number) => {
  const recommendations: string[] = [];

  if (profile.degree.cgpa < 7.0) {
    recommendations.push("Focus on improving semester performance to cross the 7.0 CGPA threshold for better eligibility.");
  }
  
  if (profile.degree.backlogs > 0) {
    recommendations.push("Prioritize clearing active backlogs. Many companies have strict zero-backlog policies.");
  }

  if (profile.skills.employabilityScore < 70) {
    recommendations.push("Increase quantitative and logical reasoning practice for aptitude tests.");
  }

  if (profile.skills.technicalScore < 70) {
    recommendations.push("Focus on Data Structures, Algorithms, and core subjects (OS, DBMS, CN).");
  }

  if (profile.degree.internships === 0 && profile.degree.workExperience === 0) {
    recommendations.push("Consider completing a relevant summer internship or practical training program to gain industry exposure.");
  }

  if (profile.skills.projectsCount < 2) {
    recommendations.push("Build 2-3 strong portfolio projects aligned with your target role to showcase your skills.");
  }

  if (profile.skills.communicationScore < 70) {
    recommendations.push("Practice technical explanation and behavioral interviews to improve communication confidence.");
  }
  
  if (recommendations.length === 0 && score >= 90) {
    recommendations.push("Your profile is exceptionally strong. Focus on advanced interview prep and applying to top-tier companies.");
  }

  return recommendations;
};
