import { Goal } from '@/domain/goals/types/goal.types';

export interface GoalProgressConfig {
  goal: Goal;
  currentCgpa?: number;
  currentAttendance?: number;
  activeBacklogs?: number;
}

export function calculateGoalProgress(config: GoalProgressConfig): { percentage: number; currentValue: number } {
  const { goal, currentCgpa = 0, currentAttendance = 0, activeBacklogs = 0 } = config;

  if (!goal.isAutomatic || !goal.metricId || goal.target === undefined) {
    // Manual goal
    const target = goal.target || 100;
    const current = goal.currentValue || 0;
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));
    return { percentage, currentValue: current };
  }

  // Automatic Goals
  let currentVal = 0;
  let percentage = 0;

  switch (goal.metricId) {
    case 'cgpa':
      currentVal = currentCgpa;
      // If target is 8.0, and current is 7.5, what's the progress?
      // Assuming starting from 0 is not fair. Assuming starting from 5.0 maybe?
      // Simple raw percentage for now, max 100.
      percentage = Math.min(100, (currentVal / goal.target) * 100);
      break;
      
    case 'attendance':
      currentVal = currentAttendance;
      percentage = Math.min(100, (currentVal / goal.target) * 100);
      break;

    case 'active-backlogs':
      currentVal = activeBacklogs;
      // If target is 0 backlogs, and current is 3. 
      // Progress is inverse. If they started at 5 and are at 3, progress is 40%.
      // Since we don't track starting value in the simple goal model easily without adding fields,
      // let's assume worst case is 10 backlogs.
      // Alternatively, if target is 0, progress = (1 - (currentVal / 10)) * 100, bounded to 0-100.
      if (goal.target === 0) {
         percentage = currentVal === 0 ? 100 : Math.max(0, 100 - (currentVal * 15)); // each backlog drops 15%
      } else {
         percentage = currentVal <= goal.target ? 100 : Math.max(0, 100 - ((currentVal - goal.target) * 15));
      }
      break;

    default:
      currentVal = goal.currentValue || 0;
      percentage = Math.min(100, Math.max(0, (currentVal / goal.target) * 100));
  }

  return { 
    percentage: Math.round(percentage), 
    currentValue: Number(currentVal.toFixed(2)) 
  };
}
