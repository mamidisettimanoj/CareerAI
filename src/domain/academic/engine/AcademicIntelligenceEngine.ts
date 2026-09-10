// src/domain/academic/engine/AcademicIntelligenceEngine.ts

import { AcademicRecord, AcademicIntelligenceResult, AcademicTrend, BacklogStatus, DataCompleteness } from '../types/academic.types';

export function analyzeAcademicRecord(record: AcademicRecord): AcademicIntelligenceResult {
  const warnings: string[] = [];
  let completeness: DataCompleteness = 'COMPLETE';

  // 1. Validate Core Metrics
  const cgpa = record.cgpa ?? null;
  if (cgpa !== null && (cgpa < 0 || cgpa > 10)) {
    warnings.push("Invalid CGPA provided. Must be between 0 and 10.");
    completeness = 'PARTIAL';
  }
  
  const percentage = record.percentage ?? null;
  if (percentage !== null && (percentage < 0 || percentage > 100)) {
    warnings.push("Invalid Percentage provided. Must be between 0 and 100.");
    completeness = 'PARTIAL';
  }

  if (cgpa === null && percentage === null) {
    warnings.push("No CGPA or Percentage data provided.");
    completeness = 'MISSING';
  }

  // 2. Backlog Analysis
  let backlogStatus: BacklogStatus = 'UNKNOWN';
  if (record.activeBacklogs !== undefined && record.activeBacklogs !== null) {
    if (record.activeBacklogs > 0) {
      backlogStatus = 'ACTIVE';
    } else if (record.historicalBacklogs !== undefined && record.historicalBacklogs !== null && record.historicalBacklogs > 0) {
      backlogStatus = 'CLEARED_HISTORICAL';
    } else {
      backlogStatus = 'CLEAR';
    }
  } else {
    warnings.push("Backlog status is unknown.");
    if (completeness === 'COMPLETE') completeness = 'PARTIAL';
  }

  // 3. Semester Metrics & Trend
  let bestSgpa: number | null = null;
  let lowestSgpa: number | null = null;
  let averageSgpa: number | null = null;
  let trend: AcademicTrend = 'INSUFFICIENT_DATA';
  let consistencyScore: number | null = null;

  // Filter out semesters missing SGPA and sort by term number
  const validSemesters = record.semesters
    .filter(s => s.sgpa !== null && s.sgpa !== undefined && s.sgpa >= 0 && s.sgpa <= 10)
    .sort((a, b) => a.termNumber - b.termNumber);

  if (validSemesters.length > 0) {
    const sgpas = validSemesters.map(s => s.sgpa as number);
    bestSgpa = Math.max(...sgpas);
    lowestSgpa = Math.min(...sgpas);
    averageSgpa = sgpas.reduce((a, b) => a + b, 0) / sgpas.length;

    // Trend calculation requires at least 2 chronological semesters
    if (validSemesters.length >= 2) {
      const last = sgpas[sgpas.length - 1];
      const prev = sgpas[sgpas.length - 2];
      
      const threshold = 0.2; // 0.2 difference to mark a trend
      if (last > prev + threshold) {
        trend = 'IMPROVING';
      } else if (last < prev - threshold) {
        trend = 'DECLINING';
      } else {
        trend = 'STABLE';
      }

      // Consistency Score calculation (using variance approximation)
      if (validSemesters.length >= 3) {
        let varianceSum = 0;
        for (let i = 0; i < sgpas.length; i++) {
          varianceSum += Math.pow(sgpas[i] - averageSgpa, 2);
        }
        const variance = varianceSum / sgpas.length;
        // Map variance to a 0-100 score: lower variance = higher score
        consistencyScore = Math.max(0, 100 - (variance * 50)); 
      }
    }
  } else {
    warnings.push("Insufficient semester data for trend analysis.");
    if (completeness === 'COMPLETE') completeness = 'PARTIAL';
  }

  return {
    trend,
    consistencyScore,
    backlogStatus,
    dataCompleteness: completeness,
    warnings,
    metrics: {
      bestSgpa,
      lowestSgpa,
      averageSgpa
    }
  };
}
