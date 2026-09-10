import { repositories } from './ServiceLocator';
import { Goal } from '@/domain/goals/types/goal.types';
import { DailyTask, ActivityStreak } from '@/domain/daily/types/daily.types';

export class GoalService {
  // Goals
  async getGoals(): Promise<Goal[]> {
    return await repositories.goals.getGoals();
  }

  async getGoal(id: string): Promise<Goal | null> {
    return await repositories.goals.getGoal(id);
  }

  async saveGoal(goal: Goal): Promise<void> {
    await repositories.goals.saveGoal(goal);
  }

  async deleteGoal(id: string): Promise<void> {
    await repositories.goals.deleteGoal(id);
  }

  // Daily Tasks
  async getDailyTasks(): Promise<DailyTask[]> {
    return await repositories.goals.getDailyTasks();
  }

  async saveDailyTask(task: DailyTask): Promise<void> {
    await repositories.goals.saveDailyTask(task);
  }

  async deleteDailyTask(id: string): Promise<void> {
    await repositories.goals.deleteDailyTask(id);
  }

  // Streak
  async getStreak(): Promise<ActivityStreak | null> {
    return await repositories.goals.getStreak();
  }

  async saveStreak(streak: ActivityStreak): Promise<void> {
    await repositories.goals.saveStreak(streak);
  }
}

export const goalService = new GoalService();
