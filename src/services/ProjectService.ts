import { repositories } from './ServiceLocator';
import { ProjectData } from '@/types';

export class ProjectService {
  async getProjects(): Promise<ProjectData[]> {
    return await repositories.project.getProjects();
  }

  async saveProjects(projects: ProjectData[]): Promise<void> {
    await repositories.project.saveProjects(projects);
  }
}

export const projectService = new ProjectService();
