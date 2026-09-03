import { IProjectRepository } from '../interfaces/IProjectRepository';
import { ProjectData } from '@/types';
import * as storage from '@/lib/storage';

export class LocalProjectRepository implements IProjectRepository {
  async getProjects(): Promise<ProjectData[]> {
    return storage.loadData().projects || [];
  }

  async saveProjects(projects: ProjectData[]): Promise<void> {
    storage.saveData({ projects });
  }
}
