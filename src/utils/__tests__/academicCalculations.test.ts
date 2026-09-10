import { describe, it, expect } from 'vitest';
import { 
  getGradePoint, 
  calculateSGPA, 
  calculateCGPA, 
  calculateRequiredCGPA, 
  calculateAttendance 
} from '../academicCalculations';
import { SubjectData, SemesterData } from '@/types';

describe('academicCalculations', () => {

  describe('getGradePoint', () => {
    it('returns correct mapping for letter grades', () => {
      expect(getGradePoint('O')).toBe(10);
      expect(getGradePoint('A+')).toBe(9);
      expect(getGradePoint('F')).toBe(0);
    });

    it('returns numeric value if string is a number', () => {
      expect(getGradePoint('8.5')).toBe(8.5);
    });

    it('returns null for invalid inputs', () => {
      expect(getGradePoint('XYZ')).toBe(null);
      expect(getGradePoint(11)).toBe(null);
      expect(getGradePoint(-1)).toBe(null);
    });
  });

  describe('calculateSGPA', () => {
    it('calculates SGPA correctly from subjects', () => {
      const subjects: SubjectData[] = [
        { id: '1', semesterId: 's1', subjectCode: 'C1', subjectName: 'Sub1', credits: 4, grade: 'O' }, // 40
        { id: '2', semesterId: 's1', subjectCode: 'C2', subjectName: 'Sub2', credits: 3, grade: 'A' }, // 24
        { id: '3', semesterId: 's1', subjectCode: 'C3', subjectName: 'Sub3', credits: 2, gradePoint: 7 } // 14
      ];
      // total credits = 9, total points = 78, SGPA = 8.67
      const result = calculateSGPA(subjects);
      expect(result.sgpa).toBe(8.67);
      expect(result.totalCredits).toBe(9);
    });

    it('handles zero credits gracefully', () => {
      const result = calculateSGPA([{ id: '1', semesterId: '1', subjectCode: '1', subjectName: '1', credits: 0, gradePoint: 10 }]);
      expect(result.sgpa).toBe(0);
    });
  });

  describe('calculateCGPA', () => {
    it('calculates weighted CGPA from semesters', () => {
      const semesters: SemesterData[] = [
        { id: '1', name: 'S1', sgpa: 8.5, credits: 20 }, // 170
        { id: '2', name: 'S2', sgpa: 9.0, credits: 22 }  // 198
      ];
      // total credits = 42, total points = 368, CGPA = 8.76
      const result = calculateCGPA(semesters);
      expect(result.cgpa).toBe(8.76);
      expect(result.totalCredits).toBe(42);
    });

    it('ignores upcoming semesters', () => {
      const semesters: SemesterData[] = [
        { id: '1', name: 'S1', sgpa: 8.0, credits: 20, status: 'Completed' },
        { id: '2', name: 'S2', sgpa: 10.0, credits: 20, status: 'Upcoming' }
      ];
      const result = calculateCGPA(semesters);
      expect(result.cgpa).toBe(8.0);
    });
  });

  describe('calculateRequiredCGPA', () => {
    it('calculates achievable targets', () => {
      // current: 8.0 over 40 credits (320 pts)
      // target: 8.5 over 80 credits (680 pts)
      // needed: 360 pts over 40 credits -> 9.0
      const result = calculateRequiredCGPA(8.0, 40, 8.5, 40);
      expect(result.requiredAverage).toBe(9.0);
      expect(result.isPossible).toBe(true);
    });

    it('detects impossible targets', () => {
      // current 7.0 over 60 credits
      // target 9.0 over 80 credits (requires 300 pts from 20 credits -> 15.0 average)
      const result = calculateRequiredCGPA(7.0, 60, 9.0, 20);
      expect(result.isPossible).toBe(false);
    });
  });

  describe('calculateAttendance', () => {
    it('calculates basic percentage', () => {
      const result = calculateAttendance(40, 30, 75);
      expect(result.percentage).toBe(75.0);
      expect(result.status).toBe('WARNING');
    });

    it('calculates how many can miss', () => {
      const result = calculateAttendance(50, 45, 75);
      expect(result.percentage).toBe(90.0);
      // 45 / (50 + miss) = 0.75 -> 45 = 37.5 + 0.75miss -> 7.5 = 0.75miss -> miss = 10
      expect(result.canMiss).toBe(10);
    });

    it('calculates how many need to attend', () => {
      const result = calculateAttendance(50, 30, 75);
      // current 60%
      // (30 + need) / (50 + need) = 0.75
      // 30 + need = 37.5 + 0.75need
      // 0.25need = 7.5
      // need = 30
      expect(result.needToAttend).toBe(30);
      expect(result.status).toBe('DANGER');
    });

    it('handles target = 100% when a class is missed', () => {
       const result = calculateAttendance(10, 9, 100);
       expect(result.needToAttend).toBe(-1); // Infinity converted to -1
       expect(result.status).toBe('DANGER');
    });
  });

});
