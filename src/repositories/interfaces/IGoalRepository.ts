import { Goal } from '@/domain/goals/types/goal.types';
import { DailyTask as DT, ActivityStreak as AS } from '@/domain/daily/types/daily.types';

export interface IGoalRepository {
  // Goals
  getGoals(): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | null>;
  saveGoal(goal: Goal): Promise<void>;
  deleteGoal(id: string): Promise<void>;

  // Daily Tasks
  getDailyTasks(): Promise<DT[]>;
  getDailyTask(id: string): Promise<DT | null>;
  saveDailyTask(task: DT): Promise<void>;
  deleteDailyTask(id: string): Promise<void>;

  // Streaks
  getStreak(): Promise<AS | null>;
  saveStreak(streak: AS): Promise<void>;
}
