import { IProfileRepository } from '../interfaces/IProfileRepository';
import { UserProfile } from '@/types';
import * as storage from '@/lib/storage';

export class LocalProfileRepository implements IProfileRepository {
  async getProfile(): Promise<UserProfile | null> {
    const data = storage.loadData();
    return data.profile || null;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    storage.saveData({ profile });
  }

  async deleteProfile(): Promise<void> {
    storage.saveData({ profile: null });
  }
}
