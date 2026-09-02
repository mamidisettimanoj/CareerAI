import { DataService } from './DataService';
import * as localStorageImpl from '@/lib/storage';
import { AppState } from '@/types';

/**
 * Implementation of DataService using localStorage.
 * Temporary bridge during Phase 1 migration.
 */
export class LocalStorageDataService implements DataService {
  loadData(): AppState {
    return localStorageImpl.loadData();
  }

  saveData(data: Partial<AppState>): void {
    localStorageImpl.saveData(data);
  }

  clearData(): void {
    localStorageImpl.clearData();
  }

  exportData(): void {
    localStorageImpl.exportData();
  }

  importData(jsonData: string): boolean {
    return localStorageImpl.importData(jsonData);
  }

  loadDemoProfile(): void {
    localStorageImpl.loadDemoProfile();
  }
}

// Global instance for Phase 1
export const dataService = new LocalStorageDataService();
