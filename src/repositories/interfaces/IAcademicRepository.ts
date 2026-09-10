import { SemesterData, SubjectData, BacklogData } from '@/types';

export interface IAcademicRepository {
  // Semesters
  getSemesters(): Promise<SemesterData[]>;
  getSemester(id: string): Promise<SemesterData | null>;
  saveSemester(semester: SemesterData): Promise<void>;
  saveSemesters(semesters: SemesterData[]): Promise<void>;
  deleteSemester(id: string): Promise<void>;

  // Subjects
  getSubjects(semesterId?: string): Promise<SubjectData[]>;
  getSubject(id: string): Promise<SubjectData | null>;
  saveSubject(subject: SubjectData): Promise<void>;
  deleteSubject(id: string): Promise<void>;

  // Backlogs
  getBacklogs(semesterId?: string): Promise<BacklogData[]>;
  getBacklog(id: string): Promise<BacklogData | null>;
  saveBacklog(backlog: BacklogData): Promise<void>;
  deleteBacklog(id: string): Promise<void>;
}
