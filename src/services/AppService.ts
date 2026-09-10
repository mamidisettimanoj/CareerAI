import { AppState } from '@/types';
import { profileService } from './ProfileService';
import { academicService } from './AcademicService';
import { projectService } from './ProjectService';
import { careerService } from './CareerService';
import { repositories } from './ServiceLocator';
import { migrateLegacyDataToIndexedDB } from '@/lib/migration';
import { loadSettings, clearData, exportData, importData } from '@/lib/storage';

export class AppService {
  private hasMigrated = false;

  private async ensureMigration() {
    if (!this.hasMigrated) {
      await migrateLegacyDataToIndexedDB();
      this.hasMigrated = true;
    }
  }

  /**
   * Loads the full application state by aggregating from specific domain repositories.
   */
  async loadData(): Promise<AppState> {
    await this.ensureMigration();

    const profile = await profileService.getProfile();
    const semesters = await academicService.getSemesters();
    const projects = await projectService.getProjects();
    const engineResult = await careerService.getCachedAnalysis();
    const predictions = engineResult ? await repositories.career.getPredictions() : [];
    const settings = loadSettings();

    // Legacy format compatibility
    return {
      profile,
      semesters,
      projects,
      certifications: [], // Placeholder for CertificationService
      predictions,
      tasks: [], // Placeholder for new PrepTasks format compatibility if needed
      engineResult: engineResult || undefined,
      settings
    };
  }

  async saveData(data: Partial<AppState>): Promise<void> {
    await this.ensureMigration();
    if (data.profile !== undefined) await profileService.saveProfile(data.profile!);
    if (data.semesters !== undefined) await academicService.saveSemesters(data.semesters);
    if (data.projects !== undefined) await projectService.saveProjects(data.projects);
    if (data.engineResult) await repositories.career.saveEngineResult(data.engineResult);
    if (data.predictions) await repositories.career.savePredictions(data.predictions);
  }

  async clearData(): Promise<void> {
    await clearData();
  }

  async exportData(): Promise<void> {
    await exportData();
  }

  async importData(jsonData: string): Promise<boolean> {
    return await importData(jsonData);
  }

  async loadDemoProfile(): Promise<void> {
    await this.ensureMigration();
    const { db } = await import('@/lib/db');
    if (!db) return;

    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map(t => t.clear()));

      await db.profile.put({
        id: 'me',
        personal: { gender: 'Male', sscBoard: 'CBSE', sscPercentage: 88, academicYear: '2025' },
        hsc: { board: 'CBSE', stream: 'Science', percentage: 85 },
        degree: { type: 'B.Tech', branch: 'Computer Science', percentage: 78, cgpa: 8.2, workExperience: 0, internships: 2, backlogs: 0 },
        mba: { specialization: 'None', percentage: 0 },
        skills: { employabilityScore: 85, technicalScore: 80, communicationScore: 75, projectsCount: 3, certificationsCount: 2 },
        targetRole: 'Software Developer'
      });

      await db.semesters.bulkPut([
        { id: '1', name: 'Semester 1', sgpa: 7.8, credits: 20 },
        { id: '2', name: 'Semester 2', sgpa: 8.0, credits: 22 },
        { id: '3', name: 'Semester 3', sgpa: 8.4, credits: 24 },
        { id: '4', name: 'Semester 4', sgpa: 8.6, credits: 24 }
      ]);

      await db.projects.bulkPut([
        { 
          id: '1', 
          name: 'E-Commerce App', 
          title: 'E-Commerce App',
          technology: 'React, Node, MongoDB', 
          technologies: ['React', 'Node', 'MongoDB'],
          description: 'Full stack app', 
          difficulty: 'Medium', 
          role: 'Full Stack',
          category: 'Personal',
          status: 'Completed',
          skillsDemonstrated: [],
          achievements: []
        }
      ]);
    });
  }
}

export const appService = new AppService();
