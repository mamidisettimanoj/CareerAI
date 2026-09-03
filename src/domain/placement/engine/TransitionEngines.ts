import { DriveStatus, ParticipationStatus } from '@prisma/client';

export class DriveStatusTransitionEngine {
  validate(current: DriveStatus, next: DriveStatus): { valid: boolean; reason?: string } {
    if (current === next) return { valid: false, reason: 'Already in this status.' };

    const validTransitions: Record<DriveStatus, DriveStatus[]> = {
      DRAFT: [DriveStatus.OPEN, DriveStatus.CANCELLED],
      OPEN: [DriveStatus.CLOSED, DriveStatus.CANCELLED],
      CLOSED: [DriveStatus.COMPLETED, DriveStatus.CANCELLED],
      COMPLETED: [],
      CANCELLED: []
    };

    if (!validTransitions[current].includes(next)) {
      return { valid: false, reason: `Invalid transition from ${current} to ${next}.` };
    }

    return { valid: true };
  }
}

export const driveStatusTransitionEngine = new DriveStatusTransitionEngine();

export class ParticipationTransitionEngine {
  validate(current: ParticipationStatus, next: ParticipationStatus): { valid: boolean; reason?: string } {
    if (current === next) return { valid: false, reason: 'Already in this status.' };

    const validTransitions: Record<ParticipationStatus, ParticipationStatus[]> = {
      REGISTERED: [ParticipationStatus.SHORTLISTED, ParticipationStatus.REJECTED, ParticipationStatus.WITHDRAWN],
      SHORTLISTED: [ParticipationStatus.ASSESSMENT, ParticipationStatus.INTERVIEW, ParticipationStatus.REJECTED, ParticipationStatus.WITHDRAWN],
      ASSESSMENT: [ParticipationStatus.INTERVIEW, ParticipationStatus.REJECTED, ParticipationStatus.WITHDRAWN],
      INTERVIEW: [ParticipationStatus.SELECTED, ParticipationStatus.REJECTED, ParticipationStatus.WITHDRAWN],
      SELECTED: [ParticipationStatus.WITHDRAWN],
      REJECTED: [],
      WITHDRAWN: []
    };

    if (!validTransitions[current].includes(next)) {
      return { valid: false, reason: `Invalid participation transition from ${current} to ${next}.` };
    }

    return { valid: true };
  }
}

export const participationTransitionEngine = new ParticipationTransitionEngine();
