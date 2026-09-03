import { UserProfile } from '@/types';

export interface IProfileRepository {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
  deleteProfile(): Promise<void>;
}
