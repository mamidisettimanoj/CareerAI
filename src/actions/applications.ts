'use server';

import { requireCareerUser } from '@/lib/auth';
import { ApplicationStatus } from '@prisma/client';
import { handleActionError } from '@/lib/errors';
import { ApplicationService } from '@/domain/applications/service/ApplicationService';
import { CreateApplicationDto } from '@/domain/applications/types';

import { prisma } from '@/lib/prisma';
const applicationService = new ApplicationService(prisma);

export async function createManualApplicationAction(dto: CreateApplicationDto) {
  try {
    const user = await requireCareerUser();
    const profileId = user.profile?.id;
    if (!profileId) throw new Error('Profile missing.');

    const app = await applicationService.createApplication(profileId, dto);
    return { success: true, application: app };
  } catch (e: any) {
    return handleActionError(e);
  }
}

export async function createFromJobAction(jobId: string) {
  try {
    const user = await requireCareerUser();
    const profileId = user.profile?.id;
    if (!profileId) throw new Error('Profile missing.');

    const app = await applicationService.createFromJob(profileId, jobId);
    return { success: true, application: app };
  } catch (e: any) {
    return handleActionError(e);
  }
}

export async function listApplicationsAction(filters: any, pagination: any) {
  try {
    const user = await requireCareerUser();
    const profileId = user.profile?.id;
    if (!profileId) throw new Error('Profile missing.');

    const result = await applicationService.listApplications(profileId, filters, pagination);
    return { success: true, ...result };
  } catch (e: any) {
    return handleActionError(e);
  }
}

export async function changeApplicationStatusAction(applicationId: string, newStatus: ApplicationStatus, expectedVersion: number, note?: string) {
  try {
    const user = await requireCareerUser();
    const profileId = user.profile?.id;
    if (!profileId) throw new Error('Profile missing.');

    const updated = await applicationService.changeStatus(profileId, applicationId, newStatus, expectedVersion, note);
    return { success: true, application: updated };
  } catch (e: any) {
    return handleActionError(e);
  }
}

export async function getDashboardMetricsAction() {
  try {
    const user = await requireCareerUser();
    const profileId = user.profile?.id;
    if (!profileId) throw new Error('Profile missing.');

    const metrics = await applicationService.getDashboardMetrics(profileId);
    return { success: true, metrics };
  } catch (e: any) {
    return handleActionError(e);
  }
}

export async function addApplicationNoteAction(applicationId: string, expectedVersion: number, note: string) {
  try {
    const user = await requireCareerUser();
    const profileId = user.profile?.id;
    if (!profileId) throw new Error('Profile missing.');

    const app = await applicationService.addPrivateNote(profileId, applicationId, expectedVersion, note);
    return { success: true, application: app };
  } catch (e: any) {
    return handleActionError(e);
  }
}

export async function archiveApplicationAction(applicationId: string, expectedVersion: number) {
  try {
    const user = await requireCareerUser();
    const profileId = user.profile?.id;
    if (!profileId) throw new Error('Profile missing.');

    const app = await applicationService.archiveApplication(profileId, applicationId, expectedVersion);
    return { success: true, application: app };
  } catch (e: any) {
    return handleActionError(e);
  }
}
