// src/domain/academic/types/academic.types.ts

export type AcademicTrend = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
export type DataCompleteness = 'COMPLETE' | 'PARTIAL' | 'MISSING';
export type BacklogStatus = 'CLEAR' | 'ACTIVE' | 'CLEARED_HISTORICAL' | 'UNKNOWN';

export interface SemesterRecord {
  id: string;
  termNumber: number;
  sgpa?: number | null;
  credits?: number | null;
}

export interface AcademicRecord {
  cgpa?: number | null;
  percentage?: number | null;
  activeBacklogs?: number | null;
  historicalBacklogs?: number | null;
  semesters: SemesterRecord[];
}

export interface AcademicIntelligenceResult {
  trend: AcademicTrend;
  consistencyScore: number | null; // 0-100, null if insufficient data
  backlogStatus: BacklogStatus;
  dataCompleteness: DataCompleteness;
  warnings: string[];
  metrics: {
    bestSgpa: number | null;
    lowestSgpa: number | null;
    averageSgpa: number | null;
  };
}
