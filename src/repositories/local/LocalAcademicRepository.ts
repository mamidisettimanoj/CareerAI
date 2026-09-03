import { IAcademicRepository } from '../interfaces/IAcademicRepository';
import { SemesterData } from '@/types';
import * as storage from '@/lib/storage';

export class LocalAcademicRepository implements IAcademicRepository {
  async getSemesters(): Promise<SemesterData[]> {
    return storage.loadData().semesters || [];
  }

  async saveSemesters(semesters: SemesterData[]): Promise<void> {
    storage.saveData({ semesters });
  }
}
