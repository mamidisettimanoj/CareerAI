import { ApplicationStatus } from '@prisma/client';
import { StatusTransitionResult } from '../types';

export class ApplicationStatusTransitionEngine {
  private validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.SAVED]: [ApplicationStatus.APPLIED, ApplicationStatus.WITHDRAWN],
    [ApplicationStatus.APPLIED]: [
      ApplicationStatus.SCREENING, 
      ApplicationStatus.ASSESSMENT, 
      ApplicationStatus.INTERVIEW, 
      ApplicationStatus.REJECTED, 
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ON_HOLD
    ],
    [ApplicationStatus.SCREENING]: [
      ApplicationStatus.ASSESSMENT, 
      ApplicationStatus.INTERVIEW, 
      ApplicationStatus.REJECTED, 
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ON_HOLD
    ],
    [ApplicationStatus.ASSESSMENT]: [
      ApplicationStatus.INTERVIEW, 
      ApplicationStatus.REJECTED, 
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ON_HOLD
    ],
    [ApplicationStatus.INTERVIEW]: [
      ApplicationStatus.OFFER, 
      ApplicationStatus.REJECTED, 
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ON_HOLD
    ],
    [ApplicationStatus.OFFER]: [
      ApplicationStatus.ACCEPTED, 
      ApplicationStatus.REJECTED, 
      ApplicationStatus.WITHDRAWN
    ],
    [ApplicationStatus.ACCEPTED]: [
      ApplicationStatus.WITHDRAWN // e.g., renege
    ],
    [ApplicationStatus.REJECTED]: [
      // Explicitly cannot go anywhere unless a special reopen mechanism exists, but we block it here.
    ],
    [ApplicationStatus.WITHDRAWN]: [],
    [ApplicationStatus.ON_HOLD]: [
      ApplicationStatus.SCREENING,
      ApplicationStatus.ASSESSMENT,
      ApplicationStatus.INTERVIEW,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN
    ]
  };

  public validateTransition(currentStatus: ApplicationStatus, requestedStatus: ApplicationStatus): StatusTransitionResult {
    if (currentStatus === requestedStatus) {
      return { valid: false, reason: 'Already in this status' };
    }

    const allowed = this.validTransitions[currentStatus];
    if (!allowed || !allowed.includes(requestedStatus)) {
      return { 
        valid: false, 
        reason: `Invalid transition from ${currentStatus} to ${requestedStatus}` 
      };
    }

    return { valid: true };
  }
}

export const applicationTransitionEngine = new ApplicationStatusTransitionEngine();
