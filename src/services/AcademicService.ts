import { repositories } from './ServiceLocator';
import { SemesterData, SubjectData, BacklogData } from '@/types';

export class AcademicService {
  // Semesters
  async getSemesters(): Promise<SemesterData[]> {
    return await repositories.academic.getSemesters();
  }

  async getSemester(id: string): Promise<SemesterData | null> {
    return await repositories.academic.getSemester(id);
  }

  async saveSemesters(semesters: SemesterData[]): Promise<void> {
    await repositories.academic.saveSemesters(semesters);
  }

  async saveSemester(semester: SemesterData): Promise<void> {
    await repositories.academic.saveSemester(semester);
  }

  async deleteSemester(id: string): Promise<void> {
    await repositories.academic.deleteSemester(id);
  }

  // Subjects
  async getSubjects(semesterId?: string): Promise<SubjectData[]> {
    return await repositories.academic.getSubjects(semesterId);
  }

  async getSubject(id: string): Promise<SubjectData | null> {
    return await repositories.academic.getSubject(id);
  }

  async saveSubject(subject: SubjectData): Promise<void> {
    await repositories.academic.saveSubject(subject);
  }

  async deleteSubject(id: string): Promise<void> {
    await repositories.academic.deleteSubject(id);
  }

  // Backlogs
  async getBacklogs(semesterId?: string): Promise<BacklogData[]> {
    return await repositories.academic.getBacklogs(semesterId);
  }

  async saveBacklog(backlog: BacklogData): Promise<void> {
    await repositories.academic.saveBacklog(backlog);
  }

  async deleteBacklog(id: string): Promise<void> {
    await repositories.academic.deleteBacklog(id);
  }
}

export const academicService = new AcademicService();
