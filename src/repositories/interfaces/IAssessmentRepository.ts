import { AssessmentCategory } from '@/domain/assessment/types/assessment.types';

export interface IAssessmentRepository {
  getAvailableAssessments(): Promise<any[]>;
  getAssessmentVersion(versionId: string): Promise<any>;
  startAttempt(profileId: string, versionId: string): Promise<any>;
  getAttempt(attemptId: string): Promise<any>;
  submitAttempt(attemptId: string, answers: any[], result: any): Promise<any>;
  getLatestResultsByCategory(profileId: string, category: AssessmentCategory): Promise<any[]>;
  getLatestResults(profileId: string): Promise<Record<string, any>>;
}
