import { SubjectData, SemesterData } from '@/types';

/**
 * Validates grade point mapping logic.
 */
export const gradePointMap: Record<string, number> = {
  'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0,
  'S': 10, 'D': 4, 'E': 0 // Variations
};

export const getGradePoint = (grade: string | number): number | null => {
  if (typeof grade === 'number') {
    return (grade >= 0 && grade <= 10) ? grade : null;
  }
  if (!grade) return null;
  const upperGrade = grade.toUpperCase();
  if (gradePointMap[upperGrade] !== undefined) return gradePointMap[upperGrade];
  
  const numericGrade = parseFloat(grade);
  if (!isNaN(numericGrade) && numericGrade >= 0 && numericGrade <= 10) return numericGrade;
  
  return null;
};

/**
 * Calculate SGPA from an array of subjects.
 * Formula: Sum(Credits * GradePoint) / Sum(Credits)
 */
export function calculateSGPA(subjects: SubjectData[]): { sgpa: number; totalCredits: number; validSubjects: number } {
  let totalCredits = 0;
  let totalGradePoints = 0;
  let validSubjects = 0;

  subjects.forEach(sub => {
    const gp = sub.gradePoint ?? getGradePoint(sub.grade ?? '');
    const credits = sub.credits;

    if (gp !== null && credits > 0) {
      totalCredits += credits;
      totalGradePoints += (credits * gp);
      validSubjects++;
    }
  });

  const sgpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;

  return { sgpa, totalCredits, validSubjects };
}

/**
 * Calculate CGPA based on semesters.
 * Uses weighted average: Sum(SGPA * Credits) / Sum(Credits)
 */
export function calculateCGPA(semesters: SemesterData[]): { cgpa: number; totalCredits: number; validSemesters: number } {
  let totalCredits = 0;
  let weightedSgpaSum = 0;
  let validSemesters = 0;

  semesters.forEach(sem => {
    if (sem.sgpa > 0 && sem.credits > 0 && sem.status !== 'Upcoming') {
      totalCredits += sem.credits;
      weightedSgpaSum += (sem.sgpa * sem.credits);
      validSemesters++;
    }
  });

  const cgpa = totalCredits > 0 ? parseFloat((weightedSgpaSum / totalCredits).toFixed(2)) : 0;
  return { cgpa, totalCredits, validSemesters };
}

/**
 * Calculate required average GPA for remaining credits to achieve a target CGPA.
 */
export function calculateRequiredCGPA(currentCgpa: number, completedCredits: number, targetCgpa: number, remainingCredits: number): { requiredAverage: number; isPossible: boolean } {
  if (remainingCredits <= 0) return { requiredAverage: 0, isPossible: false };
  
  const totalCredits = completedCredits + remainingCredits;
  const targetTotalPoints = targetCgpa * totalCredits;
  const currentPoints = currentCgpa * completedCredits;
  
  const requiredPoints = targetTotalPoints - currentPoints;
  const requiredAverage = parseFloat((requiredPoints / remainingCredits).toFixed(2));
  
  // Assuming max GPA is 10.0
  const isPossible = requiredAverage <= 10.0 && requiredAverage >= 0;
  
  return { requiredAverage, isPossible };
}

/**
 * Calculate attendance metrics.
 */
export function calculateAttendance(conducted: number, attended: number, target: number = 75) {
  if (conducted <= 0 || attended < 0 || attended > conducted || target <= 0 || target > 100) {
    return { percentage: 0, canMiss: 0, needToAttend: 0, target, status: 'UNKNOWN' };
  }

  const percentage = parseFloat(((attended / conducted) * 100).toFixed(1));
  
  // How many more classes can be missed without dropping below target?
  // (attended) / (conducted + miss) >= target/100
  // attended * 100 >= target * conducted + target * miss
  // miss <= (attended * 100 - target * conducted) / target
  let canMiss = 0;
  if (percentage >= target) {
    canMiss = Math.floor((attended * 100 - target * conducted) / target);
  }
  
  // How many continuous classes need to be attended to reach target?
  // (attended + need) / (conducted + need) >= target/100
  // (attended + need) * 100 >= target * conducted + target * need
  // need * 100 - target * need >= target * conducted - attended * 100
  // need * (100 - target) >= target * conducted - attended * 100
  let needToAttend = 0;
  if (percentage < target && target < 100) {
    needToAttend = Math.ceil((target * conducted - attended * 100) / (100 - target));
  } else if (percentage < target && target === 100) {
     needToAttend = Infinity; // Impossible to reach 100% if missed even one
  }

  let status: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
  if (percentage < target) {
    status = 'DANGER';
  } else if (percentage - target <= 5) {
    status = 'WARNING'; // Within 5% of dropping below target
  }

  return {
    percentage,
    canMiss: Math.max(0, canMiss),
    needToAttend: needToAttend === Infinity ? -1 : Math.max(0, needToAttend),
    target,
    status
  };
}
