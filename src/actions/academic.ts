'use server'

import { requireUser } from '@/lib/auth'
import { serverRepositories } from '@/services/ServerServiceLocator'
import { SemesterData } from '@/types'
import { revalidatePath } from 'next/cache'

export async function saveSemestersAction(semesters: SemesterData[]) {
  const user = await requireUser()
  
  // Validation
  for (const sem of semesters) {
    if (sem.sgpa < 0 || sem.sgpa > 10) {
      throw new Error("Invalid SGPA: Must be between 0 and 10.");
    }
    if (sem.credits < 0 || sem.credits > 200) {
      throw new Error("Invalid Credits.");
    }
  }

  // The repository itself checks for ownership using getSession() internally, 
  // but we enforce it here as well by making sure it's an authenticated route.
  await serverRepositories.academic.saveSemesters(semesters)
  
  revalidatePath('/academic')
  revalidatePath('/dashboard')
  
  return { success: true }
}
