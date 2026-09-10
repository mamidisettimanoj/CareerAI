import { IAcademicRepository } from '../interfaces/IAcademicRepository';
import { SemesterData, SubjectData, BacklogData } from '@/types';
import { db } from '@/lib/db';

export class LocalAcademicRepository implements IAcademicRepository {
  // --- Semesters ---
  async getSemesters(): Promise<SemesterData[]> {
    if (!db) return [];
    try {
      return await db.semesters.toArray();
    } catch (error) {
      console.error("Failed to get semesters", error);
      return [];
    }
  }

  async getSemester(id: string): Promise<SemesterData | null> {
    if (!db) return null;
    try {
      return await db.semesters.get(id) || null;
    } catch (error) {
      console.error("Failed to get semester", error);
      return null;
    }
  }

  async saveSemester(semester: SemesterData): Promise<void> {
    if (!db) return;
    try {
      semester.updatedAt = new Date().toISOString();
      if (!semester.createdAt) semester.createdAt = semester.updatedAt;
      await db.semesters.put(semester);
    } catch (error) {
      console.error("Failed to save semester", error);
    }
  }

  async saveSemesters(semesters: SemesterData[]): Promise<void> {
    if (!db) return;
    try {
      const now = new Date().toISOString();
      const sems = semesters.map(s => ({
        ...s,
        updatedAt: now,
        createdAt: s.createdAt || now
      }));
      await db.transaction('rw', db.semesters, async () => {
        await db.semesters.clear();
        await db.semesters.bulkPut(sems);
      });
    } catch (error) {
      console.error("Failed to save semesters", error);
    }
  }

  async deleteSemester(id: string): Promise<void> {
    if (!db) return;
    try {
      // Deleting a semester also deletes its subjects and backlogs
      await db.transaction('rw', [db.semesters, db.subjects, db.backlogs], async () => {
        await db.semesters.delete(id);
        const subjects = await db.subjects.where({ semesterId: id }).toArray();
        const subjectIds = subjects.map(s => s.id);
        await db.subjects.bulkDelete(subjectIds);
        
        const backlogs = await db.backlogs.where({ semesterId: id }).toArray();
        const backlogIds = backlogs.map(b => b.id);
        await db.backlogs.bulkDelete(backlogIds);
      });
    } catch (error) {
      console.error("Failed to delete semester", error);
    }
  }

  // --- Subjects ---
  async getSubjects(semesterId?: string): Promise<SubjectData[]> {
    if (!db) return [];
    try {
      if (semesterId) {
        return await db.subjects.where({ semesterId }).toArray();
      }
      return await db.subjects.toArray();
    } catch (error) {
      console.error("Failed to get subjects", error);
      return [];
    }
  }

  async getSubject(id: string): Promise<SubjectData | null> {
    if (!db) return null;
    try {
      return await db.subjects.get(id) || null;
    } catch (error) {
      console.error("Failed to get subject", error);
      return null;
    }
  }

  async saveSubject(subject: SubjectData): Promise<void> {
    if (!db) return;
    try {
      await db.subjects.put(subject);
      
      // Auto-update or create backlog if subject is failed
      if (subject.result === 'FAIL') {
        const existingBacklog = await db.backlogs.where({ subjectId: subject.id }).first();
        if (existingBacklog) {
          if (existingBacklog.status === 'Cleared') {
             // Subject failed again? Strange, but we mark active
             existingBacklog.status = 'Active';
             existingBacklog.attempts += 1;
             await db.backlogs.put(existingBacklog);
          }
        } else {
          const newBacklog: BacklogData = {
            id: crypto.randomUUID(),
            subjectId: subject.id,
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            semesterId: subject.semesterId,
            attempts: 1,
            status: 'Active'
          };
          await db.backlogs.put(newBacklog);
        }
      }
    } catch (error) {
      console.error("Failed to save subject", error);
    }
  }

  async deleteSubject(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.transaction('rw', [db.subjects, db.backlogs], async () => {
        await db.subjects.delete(id);
        const backlogs = await db.backlogs.where({ subjectId: id }).toArray();
        await db.backlogs.bulkDelete(backlogs.map(b => b.id));
      });
    } catch (error) {
      console.error("Failed to delete subject", error);
    }
  }

  // --- Backlogs ---
  async getBacklogs(semesterId?: string): Promise<BacklogData[]> {
    if (!db) return [];
    try {
      if (semesterId) {
        return await db.backlogs.where({ semesterId }).toArray();
      }
      return await db.backlogs.toArray();
    } catch (error) {
      console.error("Failed to get backlogs", error);
      return [];
    }
  }

  async getBacklog(id: string): Promise<BacklogData | null> {
    if (!db) return null;
    try {
      return await db.backlogs.get(id) || null;
    } catch (error) {
      console.error("Failed to get backlog", error);
      return null;
    }
  }

  async saveBacklog(backlog: BacklogData): Promise<void> {
    if (!db) return;
    try {
      await db.backlogs.put(backlog);
      
      // If backlog cleared, update the related subject's result if it exists
      if (backlog.status === 'Cleared' && backlog.subjectId) {
         const subject = await db.subjects.get(backlog.subjectId);
         if (subject && subject.result !== 'PASS') {
            subject.result = 'PASS';
            await db.subjects.put(subject);
         }
      }
    } catch (error) {
      console.error("Failed to save backlog", error);
    }
  }

  async deleteBacklog(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.backlogs.delete(id);
    } catch (error) {
      console.error("Failed to delete backlog", error);
    }
  }
}
