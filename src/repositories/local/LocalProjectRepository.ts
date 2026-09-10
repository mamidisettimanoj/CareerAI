import { IProjectRepository } from '../interfaces/IProjectRepository';
import { ProjectData } from '@/types';
import { db } from '@/lib/db';

export class LocalProjectRepository implements IProjectRepository {
  async getProjects(): Promise<ProjectData[]> {
    if (!db) return [];
    try {
      return await db.projects.toArray();
    } catch (error) {
      console.error("Failed to get projects from DB", error);
      return [];
    }
  }

  async saveProjects(projects: ProjectData[]): Promise<void> {
    if (!db) return;
    try {
      await db.transaction('rw', db.projects, async () => {
        await db.projects.clear();
        await db.projects.bulkPut(projects);
      });
    } catch (error) {
      console.error("Failed to save projects to DB", error);
    }
  }
}
