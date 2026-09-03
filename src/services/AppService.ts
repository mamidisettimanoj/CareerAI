import { AppState } from '@/types';
import { profileService } from './ProfileService';
import { academicService } from './AcademicService';
import { projectService } from './ProjectService';
import { careerService } from './CareerService';
import { repositories } from './ServiceLocator';

export class AppService {
  /**
   * Loads the full application state by aggregating from specific domain repositories.
   */
  async loadData(): Promise<AppState> {
    const profile = await profileService.getProfile();
    const semesters = await academicService.getSemesters();
    const projects = await projectService.getProjects();
    const tasks: any[] = [];
    const engineResult = await careerService.getCachedAnalysis();
    const predictions = engineResult ? await repositories.career.getPredictions() : [];

    return {
      profile,
      semesters,
      projects,
      certifications: [], // Placeholder for CertificationService
      predictions,
      tasks,
      engineResult: engineResult || undefined,
      settings: {
        theme: 'dark',
        reducedAnimations: false,
      }
    };
  }

  async saveData(data: Partial<AppState>): Promise<void> {
    if (data.profile !== undefined) await profileService.saveProfile(data.profile!);
    if (data.semesters !== undefined) await academicService.saveSemesters(data.semesters);
    if (data.projects !== undefined) await projectService.saveProjects(data.projects);
    if (data.engineResult) await repositories.career.saveEngineResult(data.engineResult);
    if (data.predictions) await repositories.career.savePredictions(data.predictions);
  }

  clearData(): void {
    // Phase 1 implementation uses local storage clearing
    if (typeof window !== 'undefined') {
      localStorage.removeItem('careerai_data');
    }
  }

  exportData(): void {
    import('@/lib/storage').then(storage => storage.exportData());
  }

  importData(jsonData: string): boolean {
    // Synchronous execution for Phase 1
    if (typeof window !== 'undefined') {
      try {
        const storage = require('@/lib/storage');
        return storage.importData(jsonData);
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  loadDemoProfile(): void {
    import('@/lib/storage').then(storage => storage.loadDemoProfile());
  }
}

export const appService = new AppService();
