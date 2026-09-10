import { db } from './db';
import { AppState } from '@/types';

const STORAGE_KEY = 'careerai_data';
const MIGRATION_FLAG = 'careerai_migrated';

export const migrateLegacyDataToIndexedDB = async () => {
  if (typeof window === 'undefined') return;

  try {
    const isMigrated = localStorage.getItem(MIGRATION_FLAG);
    if (isMigrated === 'true') {
      return; // Already migrated
    }

    const legacyDataStr = localStorage.getItem(STORAGE_KEY);
    if (!legacyDataStr) {
      // No legacy data to migrate
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return;
    }

    const data: Partial<AppState> = JSON.parse(legacyDataStr);

    if (!db) return;

    await db.transaction('rw', [
      db.profile, 
      db.semesters, 
      db.projects, 
      db.skills,
      db.certifications, 
      db.predictions, 
      db.roadmaps, 
      db.engineResult
    ], async () => {
      // 1. Profile
      if (data.profile) {
        await db.profile.put({ ...data.profile, id: 'me' });
      }

      // 2. Semesters
      if (data.semesters && Array.isArray(data.semesters)) {
        await db.semesters.bulkPut(data.semesters);
      }

      // 3. Projects
      if (data.projects && Array.isArray(data.projects)) {
        await db.projects.bulkPut(data.projects);
      }

      // 4. Certifications
      if (data.certifications && Array.isArray(data.certifications)) {
        await db.certifications.bulkPut(data.certifications);
      }

      // 5. Predictions
      if (data.predictions && Array.isArray(data.predictions)) {
        await db.predictions.bulkPut(data.predictions);
      }

      // 6. Engine Result
      if (data.engineResult) {
        await db.engineResult.put({ ...data.engineResult, id: 'latest' });
      }

      // Tasks to Roadmaps conversion (legacy PrepTasks -> RoadmapDef)
      if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
        // Convert legacy tasks to a single roadmap
        const roadmapTasks = data.tasks.map(t => ({
          id: t.id || crypto.randomUUID(),
          title: t.title,
          description: '',
          type: 'SKILL_LEARNING' as any,
          priority: 'MEDIUM' as any,
          horizon: 30 as any,
          status: (t.completed ? 'COMPLETED' : 'TODO') as any,
          estimatedMinutes: 60,
          dependencies: []
        }));

        const legacyRoadmap = {
          id: crypto.randomUUID(),
          profileId: 'me',
          version: 1,
          status: 'ACTIVE' as any,
          generatedAt: new Date(),
          tasks: roadmapTasks
        };
        await db.roadmaps.put(legacyRoadmap);
      }
    });

    // Mark as migrated
    localStorage.setItem(MIGRATION_FLAG, 'true');
    // Rename old key for safety instead of deleting
    localStorage.setItem('careerai_data_legacy_backup', legacyDataStr);
    localStorage.removeItem(STORAGE_KEY);
    
    console.log("Migration to IndexedDB complete!");

  } catch (error) {
    console.error("Failed to migrate legacy data to IndexedDB", error);
  }
};
