import { AppState, UserProfile, SemesterData, ProjectData, CertificationData, PrepTask, PredictionResult } from '../types';

const STORAGE_KEY = 'careerai_data';

const defaultState: AppState = {
  profile: null,
  semesters: [],
  projects: [],
  certifications: [],
  predictions: [],
  tasks: [],
  settings: {
    theme: 'dark',
    reducedAnimations: false,
  }
};

export const loadData = (): AppState => {
  try {
    if (typeof window === 'undefined') return defaultState;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return defaultState;
    const parsed = JSON.parse(data);
    // basic merge to ensure new keys exist if schema evolves
    return { ...defaultState, ...parsed };
  } catch (error) {
    console.error('Failed to load data from localStorage', error);
    return defaultState;
  }
};

export const saveData = (data: Partial<AppState>) => {
  try {
    if (typeof window === 'undefined') return;
    const current = loadData();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save data to localStorage', error);
  }
};

export const clearData = () => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear data', error);
  }
};

export const exportData = () => {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `careerai_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = (jsonData: string): boolean => {
  try {
    const parsed = JSON.parse(jsonData);
    if (parsed && typeof parsed === 'object') {
      saveData(parsed);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to import data', error);
    return false;
  }
};

export const loadDemoProfile = () => {
  const demoState: AppState = {
    profile: {
      personal: { gender: 'Male', sscBoard: 'CBSE', sscPercentage: 88, academicYear: '2025' },
      hsc: { board: 'CBSE', stream: 'Science', percentage: 85 },
      degree: { type: 'B.Tech', branch: 'Computer Science', percentage: 78, cgpa: 8.2, workExperience: 0, internships: 2, backlogs: 0 },
      mba: { specialization: 'None', percentage: 0 },
      skills: { employabilityScore: 85, technicalScore: 80, communicationScore: 75, projectsCount: 3, certificationsCount: 2 },
      targetRole: 'Software Developer'
    },
    semesters: [
      { id: '1', name: 'Semester 1', sgpa: 7.8, credits: 20 },
      { id: '2', name: 'Semester 2', sgpa: 8.0, credits: 22 },
      { id: '3', name: 'Semester 3', sgpa: 8.4, credits: 24 },
      { id: '4', name: 'Semester 4', sgpa: 8.6, credits: 24 }
    ],
    projects: [
      { id: '1', name: 'E-Commerce App', technology: 'React, Node, MongoDB', description: 'Full stack app', difficulty: 'Medium', role: 'Full Stack' }
    ],
    certifications: [
      { id: '1', name: 'AWS Cloud Practitioner', provider: 'AWS', date: '2023-05-15' }
    ],
    predictions: [
      { id: '1', date: new Date().toISOString(), readinessScore: 82, cgpa: 8.2, aptitude: 85, placementEstimate: 88, targetRole: 'Software Developer' }
    ],
    tasks: [
      { id: '1', title: 'Complete DSA Arrays', category: 'DSA', completed: true },
      { id: '2', title: 'Mock Interview - HR', category: 'Mock Interviews', completed: false }
    ],
    settings: { theme: 'dark', reducedAnimations: false }
  };
  saveData(demoState);
};
