import { repositories } from './ServiceLocator';
import { UserProfile } from '@/types';

export class ProfileService {
  async getProfile(): Promise<UserProfile | null> {
    return await repositories.profile.getProfile();
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await repositories.profile.saveProfile(profile);
  }

  async deleteProfile(): Promise<void> {
    await repositories.profile.deleteProfile();
  }
}

export const profileService = new ProfileService();
