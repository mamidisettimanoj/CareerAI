import { describe, it, expect } from 'vitest';
import { analyzeAcademicRecord } from '../engine/AcademicIntelligenceEngine';
import { AcademicRecord } from '../types/academic.types';

describe('AcademicIntelligenceEngine', () => {
  const baseRecord: AcademicRecord = {
    cgpa: 8.5,
    percentage: null,
    activeBacklogs: 0,
    historicalBacklogs: 0,
    semesters: []
  };

  it('1. Valid CGPA', () => {
    const result = analyzeAcademicRecord(baseRecord);
    expect(result.dataCompleteness).toBe('PARTIAL'); // due to no semesters
    expect(result.warnings).not.toContain("Invalid CGPA provided. Must be between 0 and 10.");
  });

  it('2. Invalid CGPA', () => {
    const result = analyzeAcademicRecord({ ...baseRecord, cgpa: 11 });
    expect(result.warnings).toContain("Invalid CGPA provided. Must be between 0 and 10.");
    expect(result.dataCompleteness).toBe('PARTIAL');
  });

  it('3. Valid percentage', () => {
    const result = analyzeAcademicRecord({ ...baseRecord, cgpa: null, percentage: 85 });
    expect(result.warnings).not.toContain("Invalid Percentage provided. Must be between 0 and 100.");
  });

  it('4. Invalid percentage', () => {
    const result = analyzeAcademicRecord({ ...baseRecord, percentage: 105 });
    expect(result.warnings).toContain("Invalid Percentage provided. Must be between 0 and 100.");
  });

  it('5. Missing CGPA', () => {
    const result = analyzeAcademicRecord({ ...baseRecord, cgpa: null, percentage: 80 });
    expect(result.dataCompleteness).toBe('PARTIAL'); // has percentage, but still partial due to missing semesters
  });

  it('6. Missing percentage', () => {
    const result = analyzeAcademicRecord(baseRecord);
    // baseRecord has missing percentage, should not trigger generic missing both warning
    expect(result.warnings).not.toContain("No CGPA or Percentage data provided.");
  });

  it('7. Missing both CGPA and percentage', () => {
    const result = analyzeAcademicRecord({ ...baseRecord, cgpa: null, percentage: null });
    expect(result.warnings).toContain("No CGPA or Percentage data provided.");
    expect(result.dataCompleteness).toBe('MISSING');
  });

  it('8. Active backlogs', () => {
    const result = analyzeAcademicRecord({ ...baseRecord, activeBacklogs: 2 });
    expect(result.backlogStatus).toBe('ACTIVE');
  });

  it('9. Historical cleared backlogs', () => {
    const result = analyzeAcademicRecord({ ...baseRecord, activeBacklogs: 0, historicalBacklogs: 1 });
    expect(result.backlogStatus).toBe('CLEARED_HISTORICAL');
  });

  it('10. Missing backlog information', () => {
    const result = analyzeAcademicRecord({ ...baseRecord, activeBacklogs: null });
    expect(result.backlogStatus).toBe('UNKNOWN');
    expect(result.warnings).toContain("Backlog status is unknown.");
  });

  it('11. Improving trend', () => {
    const result = analyzeAcademicRecord({
      ...baseRecord,
      semesters: [
        { id: '1', termNumber: 1, sgpa: 7.0 },
        { id: '2', termNumber: 2, sgpa: 7.5 }
      ]
    });
    expect(result.trend).toBe('IMPROVING');
  });

  it('12. Stable trend', () => {
    const result = analyzeAcademicRecord({
      ...baseRecord,
      semesters: [
        { id: '1', termNumber: 1, sgpa: 7.5 },
        { id: '2', termNumber: 2, sgpa: 7.6 }
      ]
    });
    expect(result.trend).toBe('STABLE');
  });

  it('13. Declining trend', () => {
    const result = analyzeAcademicRecord({
      ...baseRecord,
      semesters: [
        { id: '1', termNumber: 1, sgpa: 8.0 },
        { id: '2', termNumber: 2, sgpa: 7.5 }
      ]
    });
    expect(result.trend).toBe('DECLINING');
  });

  it('14. Insufficient semester data', () => {
    const result = analyzeAcademicRecord({
      ...baseRecord,
      semesters: [{ id: '1', termNumber: 1, sgpa: 8.0 }]
    });
    expect(result.trend).toBe('INSUFFICIENT_DATA');
  });

  it('15. Duplicate semester records (handles deterministically by termNumber)', () => {
    const result = analyzeAcademicRecord({
      ...baseRecord,
      semesters: [
        { id: '1', termNumber: 1, sgpa: 8.0 },
        { id: '2', termNumber: 1, sgpa: 7.5 }
      ]
    });
    expect(result.trend).toBe('DECLINING');
  });

  it('16. Missing semester records in array', () => {
    const result = analyzeAcademicRecord({
      ...baseRecord,
      semesters: [
        { id: '1', termNumber: 1, sgpa: null },
        { id: '2', termNumber: 2, sgpa: 7.5 }
      ]
    });
    expect(result.trend).toBe('INSUFFICIENT_DATA'); // Only 1 valid semester
  });

  it('17. Academic consistency', () => {
    const result = analyzeAcademicRecord({
      ...baseRecord,
      semesters: [
        { id: '1', termNumber: 1, sgpa: 8.0 },
        { id: '2', termNumber: 2, sgpa: 8.0 },
        { id: '3', termNumber: 3, sgpa: 8.0 }
      ]
    });
    expect(result.consistencyScore).toBe(100); // 0 variance
  });

  it('18. Determinism', () => {
    const record = {
      ...baseRecord,
      semesters: [
        { id: '2', termNumber: 2, sgpa: 8.0 },
        { id: '1', termNumber: 1, sgpa: 7.0 } // Unordered
      ]
    };
    const result1 = analyzeAcademicRecord(record);
    const result2 = analyzeAcademicRecord(record);
    expect(result1.trend).toBe('IMPROVING'); // sorted correctly
    expect(result1).toEqual(result2);
  });

  it('19. Boundary values (CGPA 0)', () => {
    const result = analyzeAcademicRecord({ ...baseRecord, cgpa: 0 });
    expect(result.warnings).not.toContain("Invalid CGPA provided. Must be between 0 and 10.");
  });

  it('20. Boundary values (SGPA 10)', () => {
    const result = analyzeAcademicRecord({
      ...baseRecord,
      semesters: [
        { id: '1', termNumber: 1, sgpa: 10 },
        { id: '2', termNumber: 2, sgpa: 10 }
      ]
    });
    expect(result.trend).toBe('STABLE');
    expect(result.metrics.bestSgpa).toBe(10);
  });
});
