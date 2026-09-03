import { PrismaClient, ParticipationStatus } from '@prisma/client';
import { participationTransitionEngine } from '../engine/TransitionEngines';
import { driveEligibilityEngine } from '../engine/DriveEligibilityEngine';
import { ConcurrencyConflictError } from '../../applications/types';

export class DriveParticipationService {
  constructor(private readonly prisma: PrismaClient) {}

  async registerStudent(profileId: string, driveId: string) {
    return this.prisma.$transaction(async (tx) => {
      const drive = await tx.placementDrive.findUnique({
        where: { id: driveId },
        include: { eligibilityRules: { orderBy: { version: 'desc' }, take: 1 } }
      });
      if (!drive) throw new Error('Drive not found.');
      if (drive.status !== 'OPEN') throw new Error('Drive is not open for registration.');

      const existing = await tx.placementDriveParticipation.findUnique({
        where: { placementDriveId_profileId: { placementDriveId: driveId, profileId } }
      });
      if (existing) throw new Error('Already registered for this drive.');

      const profile = await tx.profile.findUnique({
        where: { id: profileId },
        include: { education: true, skills: true }
      });
      if (!profile) throw new Error('Profile not found.');

      const rule = drive.eligibilityRules[0] || null;
      const eligibility = driveEligibilityEngine.evaluate(profile as any, rule);

      if (eligibility.status !== 'ELIGIBLE') {
        throw new Error(`Ineligible for registration: ${eligibility.reasons.join(' ')}`);
      }

      const participation = await tx.placementDriveParticipation.create({
        data: {
          placementDriveId: driveId,
          profileId,
          status: ParticipationStatus.REGISTERED,
          eligibilityResult: eligibility.status,
          eligibilityReason: eligibility.reasons.join(' '),
          ruleVersion: rule ? rule.version : 0,
          events: {
            create: {
              actorId: profileId,
              newStatus: ParticipationStatus.REGISTERED,
              note: 'Registered for drive.'
            }
          }
        }
      });

      return participation;
    });
  }

  async changeParticipationStatus(
    actorId: string,
    institutionId: string,
    participationId: string,
    newStatus: ParticipationStatus,
    expectedVersion: number,
    note?: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const participation = await tx.placementDriveParticipation.findUnique({
        where: { id: participationId },
        include: { placementDrive: true }
      });
      
      if (!participation) throw new Error('Participation not found.');
      if (participation.placementDrive.institutionId !== institutionId) {
        throw new Error('Unauthorized cross-institution access.');
      }

      const transition = participationTransitionEngine.validate(participation.status, newStatus);
      if (!transition.valid) throw new Error(transition.reason);

      const { count } = await tx.placementDriveParticipation.updateMany({
        where: { id: participationId, version: expectedVersion },
        data: { status: newStatus, version: expectedVersion + 1 }
      });

      if (count === 0) throw new ConcurrencyConflictError();

      await tx.driveParticipationEvent.create({
        data: {
          participationId,
          actorId,
          previousStatus: participation.status,
          newStatus,
          note
        }
      });

      return tx.placementDriveParticipation.findUnique({ where: { id: participationId } });
    });
  }
}
