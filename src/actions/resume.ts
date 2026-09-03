'use server'

import { requireCareerUser } from '@/lib/auth'
import { serverRepositories, storageServices } from '@/services/ServerServiceLocator'
import { revalidatePath } from 'next/cache'
import { extractTextFromPDF } from '@/domain/resume/engine/ResumeExtractor'
import { analyzeResumeText } from '@/domain/resume/engine/ResumeIntelligenceEngine'

export async function uploadResumeAction(formData: FormData) {
  const user = await requireCareerUser()
  const profileId = user.profile?.id
  if (!profileId) throw new Error('Profile not found')

  const file = formData.get('resume') as File
  if (!file) throw new Error('No file provided')

  // Validation
  if (file.size > 5 * 1024 * 1024) throw new Error('File too large (max 5MB)')
  if (file.type !== 'application/pdf') throw new Error('Only PDF files are supported')

  const filename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')

  let status: 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'UNSUPPORTED_FORMAT' = 'PROCESSING'
  let qualityScore = 0
  let completeness: 'MISSING' | 'MINIMAL' | 'PARTIAL' | 'COMPLETE' = 'MISSING'
  let intelligenceData: any = null

  // Extract Text & Analyze
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Debt 65: Hardened PDF Validation - Magic Bytes Check
    if (buffer.length < 5 || buffer.toString('utf8', 0, 5) !== '%PDF-') {
      throw new Error('Invalid PDF format. File is corrupted or not a true PDF.')
    }
    
    const text = await extractTextFromPDF(buffer)
    
    // We could pass full CareerIntelligenceInput here if we want ProfileConsistency
    // For now, we just pass undefined to skip consistency checks at upload time,
    // or we can fetch basic profile info to pass. Since `uploadResumeAction` doesn't
    // easily have full populated CareerIntelligenceInput without a heavy query, we
    // will just evaluate base quality.
    const intelligence = analyzeResumeText(text)
    
    status = intelligence.status
    qualityScore = intelligence.qualityScore
    completeness = intelligence.completeness
    intelligenceData = intelligence
  } catch (error) {
    status = 'FAILED'
  }

  // Upload to Supabase Storage
  let fileUrl = ''
  try {
    fileUrl = await storageServices.resume.uploadResume(profileId, file)
  } catch (error) {
    console.error('Storage upload failed, fallback to fake key for local dev', error)
    fileUrl = `${profileId}/mock-local-file.pdf`
  }

  await serverRepositories.resume.saveResume({
    profileId: profileId,
    fileUrl,
    filename,
    mimeType: file.type,
    fileSize: file.size,
    status,
    completeness,
    qualityScore,
    intelligence: intelligenceData
  })

  revalidatePath('/resume')
  revalidatePath('/dashboard')
  revalidatePath('/result')

  return { success: true }
}

export async function deleteResumeAction(resumeId: string) {
  const user = await requireCareerUser()
  const profileId = user.profile?.id
  if (!profileId) throw new Error('Profile not found')

  const resume = await serverRepositories.resume.getLatestResume(profileId)
  if (!resume || resume.id !== resumeId) throw new Error('Resume not found or unauthorized')

  try {
    await storageServices.resume.deleteResume(resume.fileUrl)
  } catch (error) {
    // Ignore storage deletion errors locally if supabase isn't connected
    console.error('Failed to delete from storage', error)
  }

  await serverRepositories.resume.deleteResume(resumeId, profileId)

  revalidatePath('/resume')
  return { success: true }
}
