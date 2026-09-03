import { repositories } from './ServiceLocator';
import { SemesterData } from '@/types';

export class AcademicService {
  async getSemesters(): Promise<SemesterData[]> {
    return await repositories.academic.getSemesters();
  }

  async saveSemesters(semesters: SemesterData[]): Promise<void> {
    // Here we could add validation logic (e.g. max 8 semesters)
    await repositories.academic.saveSemesters(semesters);
  }
}

export const academicService = new AcademicService();
