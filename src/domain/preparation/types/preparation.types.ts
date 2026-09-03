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

// Input that represents the intelligence state used to generate the roadmap
export interface PreparationPlanInput {
  targetRole?: string;
  readinessScore: number;
  skills: { name: string; proficiency: number; required?: boolean }[];
  projects: { id: string; name: string; score?: number }[];
  resume: { hasResume: boolean; score?: number };
  assessments: Record<string, number>; // category -> percentage
  academics: { cgpa: number; activeBacklogs: number };
  availabilityHoursPerWeek: number;
  existingTasks: PreparationTaskDef[]; // Pass in existing tasks to carry over progress
}
