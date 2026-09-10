import { IPreparationRepository } from '../interfaces/IPreparationRepository';
import { RoadmapDef, PreparationTaskDef, TaskStatus } from '@/domain/preparation/types/preparation.types';
import { db } from '@/lib/db';

export class LocalPreparationRepository implements IPreparationRepository {
  async getCurrentRoadmap(profileId: string): Promise<RoadmapDef | null> {
    if (!db) return null;
    try {
      const roadmaps = await db.roadmaps.where({ profileId, status: 'ACTIVE' }).toArray();
      if (roadmaps.length > 0) {
        // Return most recently generated
        return roadmaps.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
      }
      return null;
    } catch (error) {
      console.error("Failed to get roadmap from DB", error);
      return null;
    }
  }
  
  async saveRoadmap(roadmap: RoadmapDef): Promise<void> {
    if (!db) return;
    try {
      // Archive existing active roadmaps
      const existing = await db.roadmaps.where({ profileId: roadmap.profileId, status: 'ACTIVE' }).toArray();
      for (const rm of existing) {
        rm.status = 'ARCHIVED';
        await db.roadmaps.put(rm);
      }
      
      await db.roadmaps.put(roadmap);
    } catch (error) {
      console.error("Failed to save roadmap to DB", error);
    }
  }
  
  async updateTaskStatus(taskId: string, profileId: string, status: string): Promise<void> {
    if (!db) return;
    try {
      const roadmap = await this.getCurrentRoadmap(profileId);
      if (roadmap) {
        const task = roadmap.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = status as TaskStatus;
          await db.roadmaps.put(roadmap);
        }
      }
    } catch (error) {
      console.error("Failed to update task status in DB", error);
    }
  }

  async getTasks(profileId?: string): Promise<PreparationTaskDef[]> {
    if (!db) return [];
    try {
      const pid = profileId || 'me';
      const roadmap = await this.getCurrentRoadmap(pid);
      return roadmap ? roadmap.tasks : [];
    } catch (error) {
      console.error("Failed to get tasks from DB", error);
      return [];
    }
  }

  // --- Module 5: Tracking Methods ---

  async saveDsaAttempt(attempt: any): Promise<void> {
    if (!db) return;
    try {
      await db.dsaAttempts.put(attempt);
    } catch (e) { console.error(e); }
  }

  async getDsaAttempts(): Promise<any[]> {
    if (!db) return [];
    try { return await db.dsaAttempts.toArray(); } catch (e) { return []; }
  }

  async saveAptitudeAttempt(attempt: any): Promise<void> {
    if (!db) return;
    try { await db.aptitudeAttempts.put(attempt); } catch (e) { console.error(e); }
  }

  async getAptitudeAttempts(): Promise<any[]> {
    if (!db) return [];
    try { return await db.aptitudeAttempts.toArray(); } catch (e) { return []; }
  }

  async saveTechnicalAttempt(attempt: any): Promise<void> {
    if (!db) return;
    try { await db.technicalAttempts.put(attempt); } catch (e) { console.error(e); }
  }

  async getTechnicalAttempts(): Promise<any[]> {
    if (!db) return [];
    try { return await db.technicalAttempts.toArray(); } catch (e) { return []; }
  }

  async saveMockTest(mock: any): Promise<void> {
    if (!db) return;
    try { await db.mockTests.put(mock); } catch (e) { console.error(e); }
  }

  async getMockTests(): Promise<any[]> {
    if (!db) return [];
    try { return await db.mockTests.toArray(); } catch (e) { return []; }
  }

  async saveInterviewAnswer(answer: any): Promise<void> {
    if (!db) return;
    try { await db.interviewAnswers.put(answer); } catch (e) { console.error(e); }
  }

  async getInterviewAnswers(): Promise<any[]> {
    if (!db) return [];
    try { return await db.interviewAnswers.toArray(); } catch (e) { return []; }
  }
}
