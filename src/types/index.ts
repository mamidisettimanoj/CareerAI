// ----------------------------------------------------------------------------
// LEGACY TYPES (Used for backwards compatibility during Phase 1 migration)
// ----------------------------------------------------------------------------

export interface SemesterData {
  id: string;
  semesterNumber?: number; // legacy uses 'name'
  name: string; // legacy name like 'Semester 1'
  academicYear?: string;
  termLabel?: string;
  sgpa: number;
  credits: number;
  status?: 'Completed' | 'Current' | 'Upcoming';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectData {
  id: string;
  semesterId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  internalMarks?: number;
  midMarks?: number;
  assignmentMarks?: number;
  endSemesterMarks?: number;
  totalMarks?: number;
  grade?: string;
  gradePoint?: number;
  attendance?: {
    conducted: number;
    attended: number;
    target: number;
  };
  result?: 'PASS' | 'FAIL' | 'PENDING';
  notes?: string;
}

export interface BacklogData {
  id: string;
  subjectId?: string;
  subjectCode: string;
  subjectName: string;
  semesterId: string;
  attempts: number;
  status: 'Active' | 'Attempted' | 'Cleared';
  examDate?: string;
  result?: string;
  clearedDate?: string;
  notes?: string;
}

export interface SkillGap {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  recommendedRole?: string;
}

export interface ProjectData {
  id: string;
  title: string; // Migrated from 'name'
  description: string;
  technologies: string[]; // Migrated from 'technology' string
  role?: string;
  startDate?: string;
  endDate?: string;
  githubUrl?: string;
  demoUrl?: string; // Migrated from 'liveUrl'
  category: 'Academic' | 'Personal' | 'Freelance' | 'Open Source';
  status: 'Completed' | 'Ongoing' | 'Planned';
  skillsDemonstrated: string[]; // IDs mapping to candidate skills
  achievements: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Legacy fields kept optional for backward compatibility during migration
  name?: string;
  technology?: string;
  liveUrl?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface CertificationData {
  id: string;
  name: string;
  provider: string;
  issueDate: string; // Migrated from 'date'
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  category: 'Technical' | 'Soft Skills' | 'Management' | 'Other';
  skills: string[];
  status: 'Active' | 'Expired' | 'No Expiry';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;

  // Legacy fields
  date?: string;
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
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
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
    college?: string;
    batch?: string;
    graduationYear?: number;
    currentSemester?: number;
    type: string;
    branch: string;
    percentage: number;
    cgpa: number;
    workExperience: number;
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
  careerPreferences?: {
    targetIndustry?: string;
    preferredLocations?: string[];
    targetCompanies?: string[];
    expectedPackage?: string;
    workPreference?: string;
  };
  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    codingProfile?: string;
  };
}
  
export * from '../domain/career-intelligence/types/intelligence.types';
export * from '../domain/goals/types/goal.types';
export * from '../domain/daily/types/daily.types';

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
  engineResult?: import('../domain/career-intelligence/types/intelligence.types').IntelligenceResult | null;
}

// ----------------------------------------------------------------------------
// NEW DOMAIN TYPES (Phase 2 & DB readiness)
// ----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'PLACEMENT_ADMIN' | 'RECRUITER';
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  targetRole?: string;
}

export interface Education {
  id: string;
  profileId: string;
  institution: string;
  degreeType: string; // e.g. B.Tech, M.Tech, SSC, HSC
  branch?: string;
  cgpa?: number;
  percentage?: number;
  startYear: number;
  endYear: number;
  hasBacklogs: boolean;
}

export interface Experience {
  id: string;
  profileId: string;
  company: string;
  role: string;
  isInternship: boolean;
  durationMonths: number;
}

export interface Skill {
  id: string;
  profileId: string;
  name: string;
  proficiency: number; // 0-100
}

export interface Project {
  id: string;
  profileId: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface Certification {
  id: string;
  profileId: string;
  name: string;
  provider: string;
  issueDate: Date;
}

export interface Resume {
  id: string;
  profileId: string;
  fileUrl: string;
  atsScore?: number;
  lastParsed?: Date;
}

export interface Assessment {
  id: string;
  profileId: string;
  type: 'APTITUDE' | 'TECHNICAL' | 'COMMUNICATION';
  score: number; // 0-100
  takenAt: Date;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string[];
  eligibilityCriteria: Record<string, any>;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'REJECTED' | 'OFFERED';
}

export interface PlacementDrive {
  id: string;
  companyName: string;
  date: Date;
  roles: string[];
}

// Conceptually maps to CareerEngineResult but designed for time-series snapshot storage
export interface ReadinessSnapshot {
  id: string;
  profileId: string;
  overallScore: number;
  academicScore: number;
  technicalScore: number;
  projectScore: number;
  resumeScore: number;
  interviewScore: number;
  topStrengths: string[];
  priorityImprovements: string[];
  timestamp: Date;
}

export interface PreparationTask {
  id: string;
  profileId: string;
  title: string;
  category: string;
  isCompleted: boolean;
}

export interface Roadmap {
  id: string;
  profileId: string;
  weeks: {
    weekNumber: number;
    theme: string;
    goals: string[];
  }[];
}
