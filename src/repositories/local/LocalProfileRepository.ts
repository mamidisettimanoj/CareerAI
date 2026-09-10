import { IProfileRepository } from '../interfaces/IProfileRepository';
import { UserProfile } from '@/types';
import { db } from '@/lib/db';

export class LocalProfileRepository implements IProfileRepository {
  async getProfile(): Promise<UserProfile | null> {
    if (!db) return null;
    try {
      const profileRecord = await db.profile.get('me');
      if (!profileRecord) return null;
      const { id, ...profile } = profileRecord;
      return profile as UserProfile;
    } catch (error) {
      console.error("Failed to get profile from DB", error);
      return null;
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    if (!db) return;
    try {
      await db.profile.put({ ...profile, id: 'me' });
    } catch (error) {
      console.error("Failed to save profile to DB", error);
    }
  }

  async deleteProfile(): Promise<void> {
    if (!db) return;
    try {
      await db.profile.delete('me');
    } catch (error) {
      console.error("Failed to delete profile from DB", error);
    }
  }
}
