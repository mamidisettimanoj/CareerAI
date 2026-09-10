import { GoalCategory, GoalPriority } from '@/domain/goals/types/goal.types';

export interface DailyTask {
  id: string;
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
  dueDate: string; // ISO format
  completed: boolean;
  createdAt: string;
}

export interface ActivityStreak {
  id: string; // usually 'global'
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
}
