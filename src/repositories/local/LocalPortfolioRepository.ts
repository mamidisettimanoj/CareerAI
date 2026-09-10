import { db } from '@/lib/db';
import { InternshipData, AchievementData, ResumeVersion } from '@/domain/portfolio/types/portfolio.types';

export class LocalPortfolioRepository {
  async getInternships(): Promise<InternshipData[]> {
    if (!db) return [];
    try {
      return await db.internships.toArray();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getCertifications(): Promise<any[]> {
    if (!db) return [];
    try {
      return await db.certifications.toArray();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async saveCertification(cert: any): Promise<void> {
    if (!db) return;
    try {
      await db.certifications.put(cert);
    } catch (e) {
      console.error(e);
    }
  }

  async deleteCertification(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.certifications.delete(id);
    } catch (e) {
      console.error(e);
    }
  }

  async saveInternship(internship: InternshipData): Promise<void> {
    if (!db) return;
    try {
      await db.internships.put(internship);
    } catch (e) {
      console.error(e);
    }
  }

  async deleteInternship(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.internships.delete(id);
    } catch (e) {
      console.error(e);
    }
  }

  async getAchievements(): Promise<AchievementData[]> {
    if (!db) return [];
    try {
      return await db.achievements.toArray();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async saveAchievement(achievement: AchievementData): Promise<void> {
    if (!db) return;
    try {
      await db.achievements.put(achievement);
    } catch (e) {
      console.error(e);
    }
  }

  async deleteAchievement(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.achievements.delete(id);
    } catch (e) {
      console.error(e);
    }
  }

  async getResumeVersions(): Promise<ResumeVersion[]> {
    if (!db) return [];
    try {
      return await db.resumeVersions.toArray();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async saveResumeVersion(version: ResumeVersion): Promise<void> {
    if (!db) return;
    try {
      await db.resumeVersions.put(version);
    } catch (e) {
      console.error(e);
    }
  }

  async deleteResumeVersion(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.resumeVersions.delete(id);
    } catch (e) {
      console.error(e);
    }
  }
}
