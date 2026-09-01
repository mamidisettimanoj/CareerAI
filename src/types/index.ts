export interface SemesterData {
  id: string;
  name: string;
  sgpa: number;
  credits: number;
}

export interface SkillGap {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  recommendedRole?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  technology: string;
  description: string;
  githubUrl?: string;
  liveUrl?: string;
  role?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface CertificationData {
  id: string;
  name: string;
  provider: string;
  date: string;
  credentialUrl?: string;
}

export interface PrepTask {
  id: string;
  title: string;
  category: 'Aptitude' | 'DSA' | 'Programming' | 'Core Subjects' | 'Projects' | 'Resume' | 'Communication' | 'Mock Interviews';
  completed: boolean;
}

export interface PredictionResult {
  id: string;
  date: string;
  readinessScore: number;
  cgpa: number;
  aptitude: number;
  placementEstimate: number;
  targetRole?: string;
}

export interface UserProfile {
  personal: {
    gender: string;
    sscBoard: string;
    sscPercentage: number;
    academicYear: string;
  };
  hsc: {
    board: string;
    stream: string;
    percentage: number;
  };
  degree: {
    type: string;
    branch: string;
    percentage: number;
    cgpa: number;
    workExperience: number; // months
    internships: number;
    backlogs: number;
  };
  mba: {
    specialization: string;
    percentage: number;
  };
  skills: {
    employabilityScore: number;
    technicalScore: number;
    communicationScore: number;
    projectsCount: number;
    certificationsCount: number;
  };
  targetRole: string;
}

export interface CareerEngineResult {
  readinessScore: number;
  academicScore: number;
  technicalScore: number;
  projectScore: number;
  resumeScore: number;
  interviewScore: number;
  summary: string;
  topStrengths: string[];
  priorityImprovements: {
    area: string;
    reason: string;
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  roleMatch: {
    score: number;
    breakdown: {
      skill: string;
      status: 'match' | 'missing' | 'warning';
    }[];
  };
  sevenDayPlan: {
    day: number;
    focus: string;
    task: string;
    completed?: boolean;
  }[];
  thirtyDayRoadmap: {
    week: number;
    theme: string;
    goals: string[];
  }[];
  timestamp: string;
}

export interface AppState {
  profile: UserProfile | null;
  semesters: SemesterData[];
  projects: ProjectData[];
  certifications: CertificationData[];
  predictions: PredictionResult[];
  tasks: PrepTask[];
  settings: {
    theme: 'dark' | 'light';
    reducedAnimations: boolean;
  };
  engineResult?: CareerEngineResult | null;
}
