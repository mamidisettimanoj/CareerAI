import { UserProfile, CareerEngineResult, AppState } from '@/types';

/**
 * Core Career Intelligence Engine
 * A fully deterministic, client-side evaluation engine.
 */
export function analyzeCareerProfile(state: AppState): CareerEngineResult {
  const { profile, projects = [], certifications = [] } = state;
  if (!profile) throw new Error("Profile is required for analysis");

  // Base Scores (0-100)
  let academicScore = (profile.degree.cgpa / 10) * 100;
  
  // Adjust academic score based on backlogs
  if (profile.degree.backlogs > 0) academicScore = Math.max(0, academicScore - (profile.degree.backlogs * 10));
  if (profile.degree.backlogs > 3) academicScore = Math.max(0, academicScore - 20);

  const technicalScore = profile.skills.technicalScore;
  
  // Base project score logic
  const projectScore = Math.min(100, (profile.skills.projectsCount * 25) + (projects.length * 10));
  
  // Resume & Interview logic (approximated from inputs until dedicated tools are built)
  const resumeScore = Math.min(100, (profile.skills.projectsCount * 10) + (profile.degree.internships * 20) + 40);
  const interviewScore = Math.min(100, (profile.skills.communicationScore * 0.6) + (profile.skills.technicalScore * 0.4));
  
  const readinessScore = Math.round(
    (academicScore * 0.25) + 
    (technicalScore * 0.25) + 
    (projectScore * 0.15) + 
    (profile.skills.employabilityScore * 0.15) + 
    (resumeScore * 0.10) + 
    (interviewScore * 0.10)
  );

  // Generate Strengths & Improvements
  const topStrengths: string[] = [];
  const priorityImprovements: any[] = [];

  if (academicScore >= 80) topStrengths.push(`Strong Academic Performance (CGPA: ${profile.degree.cgpa})`);
  else priorityImprovements.push({ area: 'Academic Performance', reason: 'CGPA is critical for initial shortlisting in many campus drives.', action: 'Focus on core subjects to improve SGPA in upcoming semesters.', priority: 'HIGH' });

  if (technicalScore >= 75) topStrengths.push('Good Technical Foundation');
  else priorityImprovements.push({ area: 'Technical Skills', reason: 'Core technical competency is required for your target role.', action: 'Focus on mastering one primary programming language and core computer science concepts.', priority: 'HIGH' });

  if (profile.skills.employabilityScore >= 75) topStrengths.push('Strong Aptitude & Logical Reasoning');
  else priorityImprovements.push({ area: 'Aptitude', reason: 'Aptitude tests are the first elimination round for 90% of companies.', action: 'Practice quantitative and logical reasoning problems daily.', priority: 'HIGH' });

  if (profile.skills.projectsCount >= 2) topStrengths.push('Good Project Experience');
  else priorityImprovements.push({ area: 'Projects', reason: 'Practical implementation proves your technical skills better than grades.', action: 'Build and deploy at least one full-stack or domain-specific project.', priority: 'MEDIUM' });

  if (profile.skills.communicationScore >= 80) topStrengths.push('Strong Communication Skills');
  else priorityImprovements.push({ area: 'Communication', reason: 'Crucial for HR rounds and team collaboration.', action: 'Practice mock interviews and technical explanations out loud.', priority: 'MEDIUM' });

  if (profile.degree.internships > 0) topStrengths.push('Professional Internship Experience');
  else if (profile.degree.percentage >= 60) priorityImprovements.push({ area: 'Internships', reason: 'Real-world experience gives a massive edge over other candidates.', action: 'Apply for summer internships or open-source programs.', priority: 'LOW' });

  // Role Match Logic
  const roleMatch = generateRoleMatch(profile.targetRole, profile);

  // 7-Day Plan & 30-Day Roadmap (Customized based on weaknesses)
  const sevenDayPlan = generateSevenDayPlan(priorityImprovements);
  const thirtyDayRoadmap = generateThirtyDayRoadmap(priorityImprovements);

  // Summary Generation
  let summary = `Your overall placement readiness is estimated at ${readinessScore}%. `;
  if (readinessScore >= 80) summary += "You have a highly competitive profile for campus placements. Keep refining your advanced skills.";
  else if (readinessScore >= 60) summary += "You are on the right track, but need targeted preparation in key areas before placement season begins.";
  else summary += "Your profile requires immediate attention. Focus on clearing backlogs, practicing aptitude, and building core technical skills.";

  return {
    readinessScore,
    academicScore: Math.round(academicScore),
    technicalScore: Math.round(technicalScore),
    projectScore: Math.round(projectScore),
    resumeScore: Math.round(resumeScore),
    interviewScore: Math.round(interviewScore),
    summary,
    topStrengths,
    priorityImprovements,
    roleMatch,
    sevenDayPlan,
    thirtyDayRoadmap,
    timestamp: new Date().toISOString()
  };
}

function generateRoleMatch(role: string, profile: UserProfile) {
  const breakdown = [];
  let score = 0;

  // Generic role matching logic based on profile metrics
  if (profile.skills.technicalScore > 70) breakdown.push({ skill: "Core Technical", status: "match" as const });
  else breakdown.push({ skill: "Core Technical", status: "warning" as const });

  if (profile.skills.projectsCount >= 2) breakdown.push({ skill: "Practical Implementation", status: "match" as const });
  else breakdown.push({ skill: "Practical Implementation", status: "missing" as const });

  if (profile.skills.employabilityScore > 65) breakdown.push({ skill: "Problem Solving", status: "match" as const });
  else breakdown.push({ skill: "Problem Solving", status: "warning" as const });

  if (profile.degree.cgpa >= 7.0) breakdown.push({ skill: "Academic Criteria", status: "match" as const });
  else breakdown.push({ skill: "Academic Criteria", status: "warning" as const });

  // Weight them up
  const matches = breakdown.filter(b => b.status === 'match').length;
  const warnings = breakdown.filter(b => b.status === 'warning').length;
  
  score = Math.round((matches * 25) + (warnings * 12.5));

  return { score, breakdown };
}

function generateSevenDayPlan(weaknesses: any[]) {
  // Base generic plan
  const plan = [
    { day: 1, focus: "Profile Review", task: "Review your resume and identify missing keywords." },
    { day: 2, focus: "Aptitude Practice", task: "Solve 20 quantitative aptitude questions." },
    { day: 3, focus: "Technical Core", task: "Revise one core subject (DBMS/OS/CN)." },
    { day: 4, focus: "Coding Practice", task: "Solve 3 easy and 1 medium programming problem." },
    { day: 5, focus: "Communication", task: "Record yourself answering 3 common HR questions." },
    { day: 6, focus: "Project Work", task: "Spend 2 hours improving your best project." },
    { day: 7, focus: "Mock Test", task: "Take a full-length mock placement test." },
  ];

  // Customize based on highest priority weaknesses
  const hasAptitude = weaknesses.some(w => w.area === 'Aptitude');
  const hasTech = weaknesses.some(w => w.area === 'Technical Skills');
  const hasProjects = weaknesses.some(w => w.area === 'Projects');

  if (hasAptitude) {
    plan[1] = { day: 2, focus: "Critical Aptitude", task: "Your aptitude score is low. Solve 40 questions focusing on weak topics." };
    plan[6] = { day: 7, focus: "Aptitude Mock", task: "Take a strict 60-minute aptitude mock test." };
  }

  if (hasTech) {
    plan[2] = { day: 3, focus: "DSA Foundations", task: "Your technical score needs work. Practice Arrays and Strings." };
    plan[3] = { day: 4, focus: "DSA Practice", task: "Solve 5 foundational DSA questions." };
  }

  if (hasProjects) {
    plan[5] = { day: 6, focus: "Project Initialization", task: "Start planning a new project. Define the tech stack and goals." };
  }

  return plan;
}

function generateThirtyDayRoadmap(weaknesses: any[]) {
  return [
    {
      week: 1,
      theme: "Foundation & Academics",
      goals: ["Clear any pending assignments", "Revise core OS & DBMS concepts", "Start daily 30-min aptitude practice"]
    },
    {
      week: 2,
      theme: "Technical Deep Dive",
      goals: ["Complete basic Data Structures (Arrays, Lists, Stacks)", "Solve 20 programming problems", "Review OOP concepts"]
    },
    {
      week: 3,
      theme: "Projects & Portfolio",
      goals: ["Build or polish one significant project", "Update GitHub with proper READMEs", "Draft initial resume"]
    },
    {
      week: 4,
      theme: "Interview Readiness",
      goals: ["Participate in 2 mock interviews", "Prepare HR interview answers", "Apply to 5 off-campus opportunities"]
    }
  ];
}
