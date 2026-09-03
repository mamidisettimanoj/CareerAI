import { SemesterData } from '@/types';

export interface IAcademicRepository {
  getSemesters(): Promise<SemesterData[]>;
  saveSemesters(semesters: SemesterData[]): Promise<void>;
}
