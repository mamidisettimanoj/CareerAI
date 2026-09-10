export type AssessmentCategory = 'APTITUDE' | 'TECHNICAL' | 'COMMUNICATION' | 'LOGICAL_REASONING' | 'ROLE_SPECIFIC';
export type AssessmentStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface AssessmentQuestionDef {
  id: string;
  text: string;
  category?: string; // e.g. "Logical", "Quantitative", "React"
  type: 'MULTIPLE_CHOICE';
  options: AssessmentOptionDef[];
}

export interface AssessmentOptionDef {
  id: string;
  text: string;
  isCorrect?: boolean; // HIDDEN from client payloads!
}

export interface AssessmentVersionDef {
  id: string;
  assessmentId: string;
  versionNumber: number;
  scoringVersion: string;
  questions: AssessmentQuestionDef[];
}

export interface AssessmentTemplateDef {
  id: string;
  title: string;
  description: string;
  category: AssessmentCategory;
  difficulty: string;
  duration?: number; // minutes
}

export interface AssessmentAnswerDef {
  questionId: string;
  optionId: string | null;
}

export interface AssessmentResultDef {
  score: number;
  maxScore: number;
  percentage: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  categoryScores?: Record<string, number>;
}

export interface AssessmentAttemptDef {
  id: string;
  profileId: string;
  versionId: string;
  startTime: Date;
  submissionTime?: Date;
  status: AssessmentStatus;
  answers: AssessmentAnswerDef[];
  result?: AssessmentResultDef;
}

export interface AssessmentIntelligenceResult {
  overallScore: number;
  categoryPerformance: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  historicalTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
  status: 'AVAILABLE' | 'INSUFFICIENT_DATA';
}
