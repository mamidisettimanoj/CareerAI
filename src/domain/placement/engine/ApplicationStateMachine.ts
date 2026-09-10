import { ApplicationStatus } from '../types/placement.types';

export const ApplicationTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  SAVED: ['APPLIED', 'WITHDRAWN'],
  APPLIED: ['ASSESSMENT', 'INTERVIEWING', 'REJECTED', 'WITHDRAWN'],
  ASSESSMENT: ['INTERVIEWING', 'REJECTED', 'WITHDRAWN'],
  INTERVIEWING: ['INTERVIEWING', 'OFFERED', 'REJECTED', 'WITHDRAWN'],
  OFFERED: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'], // Student accepts/rejects offer
  ACCEPTED: [], // Terminal
  REJECTED: [], // Terminal
  WITHDRAWN: [] // Terminal
};

export function canTransition(current: ApplicationStatus, next: ApplicationStatus | 'ACCEPTED'): boolean {
  if (current === 'OFFERED' && next === 'ACCEPTED') return true;
  if (current === 'OFFERED' && next === 'REJECTED') return true;
  
  const allowed = ApplicationTransitions[current] || [];
  return allowed.includes(next as ApplicationStatus);
}
