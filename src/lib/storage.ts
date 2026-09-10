import { AppState } from '../types';
import { db } from './db';

const SETTINGS_KEY = 'careerai_settings';

export const loadSettings = () => {
  try {
    if (typeof window === 'undefined') return { theme: 'dark', reducedAnimations: false };
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return { theme: 'dark', reducedAnimations: false };
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load settings from localStorage', error);
    return { theme: 'dark', reducedAnimations: false };
  }
};

export const saveSettings = (settings: any) => {
  try {
    if (typeof window === 'undefined') return;
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save settings to localStorage', error);
  }
};

export const clearData = async () => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SETTINGS_KEY);
    if (db) {
      await Promise.all(db.tables.map(table => table.clear()));
    }
  } catch (error) {
    console.error('Failed to clear data', error);
  }
};

export const exportData = async () => {
  if (!db) return;
  try {
    const exportObj: Record<string, any> = {};
    for (const table of db.tables) {
      exportObj[table.name] = await table.toArray();
    }
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerai_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed", error);
  }
};

export const importData = async (jsonData: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const parsed = JSON.parse(jsonData);
    if (parsed && typeof parsed === 'object') {
      await db.transaction('rw', db.tables, async () => {
        for (const table of db.tables) {
          if (parsed[table.name] && Array.isArray(parsed[table.name])) {
            await table.clear();
            await table.bulkPut(parsed[table.name]);
          }
        }
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to import data', error);
    return false;
  }
};
