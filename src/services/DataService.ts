import { AppState, UserProfile } from '@/types';

/**
 * DataService interface defining all data operations.
 * Allows switching between LocalStorage (Phase 1) and Database (Phase 2).
 */
export interface DataService {
  loadData(): AppState;
  saveData(data: Partial<AppState>): void;
  clearData(): void;
  exportData(): void;
  importData(jsonData: string): boolean;
  loadDemoProfile(): void;
}
