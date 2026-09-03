'use server';

import { requirePlacementAdmin, requireCareerUser, requireStudent } from '@/lib/auth';
import { PlacementDriveService } from '@/domain/placement/service/PlacementDriveService';
import { DriveParticipationService } from '@/domain/placement/service/DriveParticipationService';
import { prisma } from '@/lib/prisma';
import { DriveStatus, ParticipationStatus } from '@prisma/client';
import { handleActionError } from '@/lib/errors';

const driveService = new PlacementDriveService(prisma);
const participationService = new DriveParticipationService(prisma);

/**
 * ------------------------------------------------------------------
 * ADMIN ACTIONS
 * ------------------------------------------------------------------
 */

export async function listDrivesAction(filters: any, pagination: any) {
  try {
    const admin = await requirePlacementAdmin();
    const result = await driveService.listDrives(admin.institutionId, filters, pagination);
    return { success: true, ...result };
  } catch (e: any) {
    return handleActionError(e);
  }
}

export async function getDriveDetailAction(driveId: string) {
  try {
    const admin = await requirePlacementAdmin();
    const drive = await driveService.getDrive(admin.institutionId, driveId);
    return { success: true, drive };
  } catch (e: any) {
    return handleActionError(e);
  }
}

export async function changeDriveStatusAction(driveId: string, status: DriveStatus, expectedVersion: number) {
  try {
    const admin = await requirePlacementAdmin();
    const drive = await driveService.changeStatus(admin.institutionId, driveId, status, expectedVersion);
    return { success: true, drive };
  } catch (e: any) {
    return handleActionError(e);
  }
}

export async function changeParticipationStatusAction(participationId: string, status: ParticipationStatus, expectedVersion: number, note?: string) {
  try {
    const admin = await requirePlacementAdmin();
    const part = await participationService.changeParticipationStatus(
      admin.id,
      admin.institutionId,
      participationId,
      status,
      expectedVersion,
      note
    );
    return { success: true, participation: part };
  } catch (e: any) {
    return handleActionError(e);
  }
}

/**
 * ------------------------------------------------------------------
 * STUDENT ACTIONS
 * ------------------------------------------------------------------
 */

export async function registerForDriveAction(driveId: string) {
  try {
    const user = await requireStudent();
    if (!user.profile?.id) throw new Error('Profile missing.');
    
    const part = await participationService.registerStudent(user.profile.id, driveId);
    return { success: true, participation: part };
  } catch (e: any) {
    return handleActionError(e);
  }
}
