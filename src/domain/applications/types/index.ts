import { Application, ApplicationEvent, ApplicationStatus } from '@prisma/client';

export type { Application, ApplicationEvent, ApplicationStatus };

export enum ApplicationSource {
  CAREERAI_JOB = 'CAREERAI_JOB',
  LINKEDIN = 'LINKEDIN',
  COMPANY_WEBSITE = 'COMPANY_WEBSITE',
  REFERRAL = 'REFERRAL',
  COLLEGE_PLACEMENT = 'COLLEGE_PLACEMENT',
  RECRUITER = 'RECRUITER',
  MANUAL = 'MANUAL',
  OTHER = 'OTHER'
}

export interface ApplicationFilters {
  status?: ApplicationStatus[];
  source?: string[];
  companyName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  archived?: boolean; // defaults to false if undefined in some queries
  location?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  metadata: {
    page: number;
    pageSize: number;
    totalCount: number;
    hasNext: boolean;
  };
}

export interface CreateApplicationDto {
  jobId?: string;
  source: string;
  sourceDescription?: string;
  companySnapshot: string;
  jobTitleSnapshot: string;
  locationSnapshot?: string;
  sourceUrlSnapshot?: string;
  employmentTypeSnapshot?: string;
  remoteTypeSnapshot?: string;
  salarySnapshot?: string;
  notes?: string;
}

export interface DashboardMetrics {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  offers: number;
  accepted: number;
  rejected: number;
  interviewRate: number | null; // null if insufficient data
  offerRate: number | null; // null if insufficient data
}

export interface StatusTransitionResult {
  valid: boolean;
  reason?: string;
}

export class ConcurrencyConflictError extends Error {
  constructor(message = 'This application was updated by another process. Please refresh and try again.') {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}
