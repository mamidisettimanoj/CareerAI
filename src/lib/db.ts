import Dexie, { Table } from 'dexie';
import { 
  UserProfile, 
  SemesterData, 
  ProjectData, 
  CertificationData, 
  PredictionResult, 
  IntelligenceResult,
  SubjectData,
  BacklogData,
  Goal,
  DailyTask,
  ActivityStreak
} from '@/types';
import { CandidateSkill } from '@/domain/skills/types/skill.types';
import { 
  RoadmapDef, 
  PreparationTaskDef,
  DsaAttempt,
  McqAttempt,
  MockTestAttempt,
  InterviewAnswer
} from '@/domain/preparation/types/preparation.types';

import {
  PlacementDrive,
  Application,
  ApplicationEvent,
  OnlineTest,
  InterviewRound,
  Offer
} from '@/domain/placement/types/placement.types';

import {
  InternshipData,
  AchievementData,
  ResumeVersion
} from '@/domain/portfolio/types/portfolio.types';

import { NotificationData } from '@/domain/notifications/types/notification.types';

export class CareerAIDatabase extends Dexie {
  profile!: Table<UserProfile & { id: string }, string>;
  semesters!: Table<SemesterData, string>;
  subjects!: Table<SubjectData, string>;
  backlogs!: Table<BacklogData, string>;
  projects!: Table<ProjectData, string>;
  skills!: Table<CandidateSkill, string>; // name is ID
  certifications!: Table<CertificationData, string>;
  predictions!: Table<PredictionResult, string>;
  roadmaps!: Table<RoadmapDef, string>;
  engineResult!: Table<IntelligenceResult & { id: string }, string>;
  
  // Module 3
  goals!: Table<Goal, string>;
  dailyTasks!: Table<DailyTask, string>;
  streaks!: Table<ActivityStreak, string>;

  // Module 5
  dsaAttempts!: Table<DsaAttempt, string>;
  aptitudeAttempts!: Table<McqAttempt, string>;
  technicalAttempts!: Table<McqAttempt, string>;
  mockTests!: Table<MockTestAttempt, string>;
  interviewAnswers!: Table<InterviewAnswer, string>;

  // Module 6
  drives!: Table<PlacementDrive, string>;
  applications!: Table<Application, string>;
  applicationEvents!: Table<ApplicationEvent, string>;
  onlineTests!: Table<OnlineTest, string>;
  interviews!: Table<InterviewRound, string>;
  offers!: Table<Offer, string>;

  // Module 7
  internships!: Table<InternshipData, string>;
  achievements!: Table<AchievementData, string>;
  resumeVersions!: Table<ResumeVersion, string>;

  // Module 8
  notifications!: Table<NotificationData, string>;

  // Future tables for when features expand:
  resumes!: Table<{ id: string, profileId: string, fileBlob: Blob, createdAt: Date }, string>;
  
  constructor() {
    super('CareerAI');
    
    // Define schema
    this.version(8).stores({
      profile: 'id', // Singleton with id 'me'
      semesters: 'id',
      subjects: 'id, semesterId',
      backlogs: 'id, subjectId, semesterId, status',
      projects: 'id',
      skills: 'name',
      certifications: 'id',
      predictions: 'id, date',
      roadmaps: 'id, profileId, status', 
      engineResult: 'id', // Singleton with id 'latest'
      goals: 'id, category, status, priority, deadline',
      dailyTasks: 'id, dueDate, completed, category',
      streaks: 'id',
      dsaAttempts: 'id, problemId, topic, difficulty, solved, date',
      aptitudeAttempts: 'id, questionId, topic, isCorrect, date',
      technicalAttempts: 'id, questionId, topic, isCorrect, date',
      mockTests: 'id, type, date',
      interviewAnswers: 'id, questionId, category',
      drives: 'id, date, status',
      applications: 'id, companyName, status, appliedDate',
      applicationEvents: 'id, applicationId, date',
      onlineTests: 'id, applicationId, date',
      interviews: 'id, applicationId, date, status',
      offers: 'id, applicationId, status, ctc',
      internships: 'id, status',
      achievements: 'id, category',
      resumeVersions: 'id',
      notifications: 'id, isRead, isDismissed',
      resumes: 'id, profileId'
    }).upgrade(tx => {
      // Handle schema upgrades
    });
  }
}

// Create singleton instance. Only initialize if in browser.
export const db = typeof window !== 'undefined' ? new CareerAIDatabase() : null as unknown as CareerAIDatabase;

