export type ApplicationStatus = 'SAVED' | 'APPLIED' | 'ASSESSMENT' | 'INTERVIEWING' | 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface PlacementDrive {
  id: string;
  companyId: string;
  companyName?: string;
  roleId: string;
  roleTitle?: string;
  date: string;
  deadline?: string;
  location?: string;
  source: string;
  notes?: string;
  status: 'UPCOMING' | 'COMPLETED' | 'MISSED';
}

export interface Application {
  id: string;
  driveId?: string; // Optional if direct apply
  companyId: string;
  companyName: string;
  roleId: string;
  roleTitle: string;
  appliedDate: string;
  status: ApplicationStatus;
  currentStage: string;
  notes?: string;
}

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  date: string;
  type: 'STATE_CHANGE' | 'NOTE' | 'ROUND_SCHEDULED';
  oldState?: ApplicationStatus;
  newState?: ApplicationStatus;
  description: string;
}

export interface OnlineTest {
  id: string;
  applicationId: string;
  type: 'APTITUDE' | 'TECHNICAL' | 'CODING' | 'MIXED';
  date: string;
  duration?: number;
  score?: number;
  result: 'PASSED' | 'FAILED' | 'PENDING';
}

export interface InterviewRound {
  id: string;
  applicationId: string;
  roundNumber: number;
  type: 'HR' | 'TECHNICAL' | 'MANAGERIAL';
  date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  feedback?: string;
}

export interface Offer {
  id: string;
  applicationId: string;
  companyName: string;
  roleTitle: string;
  ctc: number; // in LPA
  base: number;
  location: string;
  joiningDate?: string;
  status: 'RECEIVED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
}
