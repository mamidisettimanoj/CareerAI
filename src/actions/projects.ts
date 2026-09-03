'use server'

import { requireUser } from '@/lib/auth'
import { serverRepositories } from '@/services/ServerServiceLocator'
import { ProjectData } from '@/types'
import { revalidatePath } from 'next/cache'

export async function saveProjectsAction(projects: ProjectData[]) {
  await requireUser()

  const safeProjects = projects.map(p => {
    let githubUrl = p.githubUrl?.trim() || '';
    let liveUrl = p.liveUrl?.trim() || '';

    // Malicious URL prevention
    if (githubUrl.toLowerCase().startsWith('javascript:') || githubUrl.toLowerCase().startsWith('data:')) {
      githubUrl = '';
    }
    if (liveUrl.toLowerCase().startsWith('javascript:') || liveUrl.toLowerCase().startsWith('data:')) {
      liveUrl = '';
    }

    return {
      ...p,
      name: p.name.trim(),
      description: p.description.trim(),
      technology: p.technology.trim(),
      githubUrl,
      liveUrl
    };
  });

  await serverRepositories.project.saveProjects(safeProjects)
  revalidatePath('/projects')
  revalidatePath('/dashboard')
  revalidatePath('/result')
  return { success: true }
}
