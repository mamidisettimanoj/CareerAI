import { IGoalRepository } from '../interfaces/IGoalRepository';
import { Goal } from '@/domain/goals/types/goal.types';
import { DailyTask, ActivityStreak } from '@/domain/daily/types/daily.types';
import { db } from '@/lib/db';

export class LocalGoalRepository implements IGoalRepository {
  // Goals
  async getGoals(): Promise<Goal[]> {
    if (!db) return [];
    try {
      return await db.goals.toArray();
    } catch (error) {
      console.error("Failed to get goals", error);
      return [];
    }
  }

  async getGoal(id: string): Promise<Goal | null> {
    if (!db) return null;
    try {
      return await db.goals.get(id) || null;
    } catch (error) {
      console.error("Failed to get goal", error);
      return null;
    }
  }

  async saveGoal(goal: Goal): Promise<void> {
    if (!db) return;
    try {
      goal.updatedAt = new Date().toISOString();
      if (!goal.createdAt) goal.createdAt = goal.updatedAt;
      await db.goals.put(goal);
    } catch (error) {
      console.error("Failed to save goal", error);
    }
  }

  async deleteGoal(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.goals.delete(id);
    } catch (error) {
      console.error("Failed to delete goal", error);
    }
  }

  // Daily Tasks
  async getDailyTasks(): Promise<DailyTask[]> {
    if (!db) return [];
    try {
      return await db.dailyTasks.toArray();
    } catch (error) {
      console.error("Failed to get daily tasks", error);
      return [];
    }
  }

  async getDailyTask(id: string): Promise<DailyTask | null> {
    if (!db) return null;
    try {
      return await db.dailyTasks.get(id) || null;
    } catch (error) {
      console.error("Failed to get daily task", error);
      return null;
    }
  }

  async saveDailyTask(task: DailyTask): Promise<void> {
    if (!db) return;
    try {
      if (!task.createdAt) task.createdAt = new Date().toISOString();
      await db.dailyTasks.put(task);
    } catch (error) {
      console.error("Failed to save daily task", error);
    }
  }

  async deleteDailyTask(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.dailyTasks.delete(id);
    } catch (error) {
      console.error("Failed to delete daily task", error);
    }
  }

  // Streaks
  async getStreak(): Promise<ActivityStreak | null> {
    if (!db) return null;
    try {
      return await db.streaks.get('global') || null;
    } catch (error) {
      console.error("Failed to get streak", error);
      return null;
    }
  }

  async saveStreak(streak: ActivityStreak): Promise<void> {
    if (!db) return;
    try {
      await db.streaks.put({ ...streak, id: 'global' });
    } catch (error) {
      console.error("Failed to save streak", error);
    }
  }
}
