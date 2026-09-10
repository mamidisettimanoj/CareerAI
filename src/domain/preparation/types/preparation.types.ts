export type TaskType = 
  | 'SKILL_LEARNING'
  | 'SKILL_PRACTICE'
  | 'PROJECT_IMPROVEMENT'
  | 'RESUME_IMPROVEMENT'
  | 'ASSESSMENT_PRACTICE'
  | 'ACADEMIC_IMPROVEMENT'
  | 'PROFILE_COMPLETION'
  | 'ELIGIBILITY_REMEDIATION';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type PlanningHorizon = 7 | 30 | 90;

export interface PreparationTaskDef {
  id: string; // uuid generated on creation
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  horizon: PlanningHorizon;
  status: TaskStatus;
  estimatedMinutes: number;
  justification?: string;
  dependencies: string[]; // IDs of other tasks
}

export interface RoadmapDef {
  id: string;
  profileId: string;
  version: number;
  targetRole?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  generatedAt: Date;
  sourceVersionMetadata?: Record<string, string>;
  tasks: PreparationTaskDef[];
}

export interface PreparationPlanInput {
  targetRole?: string;
  readinessScore: number;
  skills: { name: string; proficiency: number; required?: boolean }[];
  projects: { id: string; name: string; score?: number }[];
  resume: { hasResume: boolean; score?: number };
  assessments: Record<string, number>;
  academics: { cgpa: number; activeBacklogs: number };
  availabilityHoursPerWeek: number;
  existingTasks: PreparationTaskDef[];
}

// ---------------------------------------------------------
// MODULE 5: PREPARATION INTELLIGENCE MODELS
// ---------------------------------------------------------

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuestionBankItem {
  id: string;
  topic: string;
  difficulty: Difficulty;
  question?: string; // For MCQs
  options?: string[]; // For MCQs
  correctAnswer?: string; // For MCQs
  explanation?: string; // For MCQs
  title?: string; // For DSA
  description?: string; // For DSA
}

export interface DsaAttempt {
  id: string;
  problemId: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  solved: boolean;
  timeSpent: number; // minutes
  confidence: number; // 0-100
  notes?: string;
  date: string; // ISO
}

export interface McqAttempt {
  id: string;
  questionId: string;
  module: 'APTITUDE' | 'TECHNICAL';
  topic: string;
  difficulty: Difficulty;
  isCorrect: boolean;
  timeSpent: number; // seconds
  date: string; // ISO
}

export interface MockTestAttempt {
  id: string;
  type: 'DSA' | 'APTITUDE' | 'TECHNICAL' | 'MIXED';
  score: number; // 0-100 percentage
  duration: number; // minutes
  date: string; // ISO
}

export interface InterviewAnswer {
  id: string;
  questionId: string;
  category: string;
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  completeness: number; // 0-100
  lastPracticed: string; // ISO
}

export interface WeakTopicAlert {
  topic: string;
  module: 'DSA' | 'APTITUDE' | 'TECHNICAL';
  reason: string;
  severity: 'HIGH' | 'MEDIUM';
}
