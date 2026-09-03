import { ProjectData } from '@/types';

export interface IProjectRepository {
  getProjects(): Promise<ProjectData[]>;
  saveProjects(projects: ProjectData[]): Promise<void>;
}
