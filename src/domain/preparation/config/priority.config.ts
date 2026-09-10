import { TaskPriority, TaskType } from '../types/preparation.types';

export const BASE_EFFORT_MINUTES: Record<TaskType, number> = {
  PROFILE_COMPLETION: 15,
  RESUME_IMPROVEMENT: 60,
  ELIGIBILITY_REMEDIATION: 120,
  ASSESSMENT_PRACTICE: 90,
  SKILL_LEARNING: 300, // 5 hours
  SKILL_PRACTICE: 120, // 2 hours
  PROJECT_IMPROVEMENT: 240, // 4 hours
  ACADEMIC_IMPROVEMENT: 180,
};

export function getTaskPriority(type: TaskType, severity: 'CRITICAL' | 'MAJOR' | 'MINOR'): TaskPriority {
  if (type === 'PROFILE_COMPLETION') return 'HIGH';
  if (type === 'ELIGIBILITY_REMEDIATION') return 'HIGH';
  
  if (severity === 'CRITICAL') return 'HIGH';
  if (severity === 'MAJOR') return 'MEDIUM';
  return 'LOW';
}
