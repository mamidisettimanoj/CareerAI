'use server'

import { requireCareerUser } from '@/lib/auth'
import { serverRepositories } from '@/services/ServerServiceLocator'
import { analyzeCareerProfile } from '@/domain/career-intelligence/engine/CareerIntelligenceEngine'
import { analyzeAcademicRecord } from '@/domain/academic/engine/AcademicIntelligenceEngine'
import { CareerIntelligenceInput } from '@/domain/career-intelligence/types/intelligence.types'
import { UserProfile } from '@/types'
import { revalidatePath } from 'next/cache'

export async function analyzeProfileAction(profileData: UserProfile) {
  const user = await requireCareerUser()
  const profileId = user.profile?.id
  if (!profileId) throw new Error('Profile not found')
  
  // 1. Save the profile data
  await serverRepositories.profile.saveProfile(profileData)
  
  // 2. Fetch full context for the engine (projects, semesters, etc.)
  const profile = await serverRepositories.profile.getProfile()
  const semesters = await serverRepositories.academic.getSemesters()
  const projects = await serverRepositories.project.getProjects()
  const tasks = await serverRepositories.preparation.getTasks()
  const skills = await serverRepositories.skills.getSkills()
  const latestResume = await serverRepositories.resume.getLatestResume(profileId)
  const assessmentResults = await serverRepositories.assessment.getLatestResults(profileId)
  
  const p = profile || profileData;
  const input: CareerIntelligenceInput = {
    academics: {
      cgpa: p.degree.cgpa,
      sscPercentage: p.personal.sscPercentage,
      hscPercentage: p.hsc.percentage,
      activeBacklogs: p.degree.backlogs,
      intelligence: analyzeAcademicRecord({
        cgpa: p.degree.cgpa,
        percentage: p.degree.percentage,
        activeBacklogs: p.degree.backlogs,
        historicalBacklogs: 0,
        semesters: semesters.map(s => ({
          id: s.id,
          termNumber: parseInt(s.name.replace('Semester ', '')) || 0,
          sgpa: s.sgpa,
          credits: s.credits
        }))
      })
    },
    skills: skills.map(s => ({
      name: s.name,
      proficiency: s.proficiencyScore
    })),
    projects: projects.map(proj => ({
      id: proj.id,
      name: proj.name,
      description: proj.description,
      technologies: proj.technology ? proj.technology.split(',').map(s => s.trim()) : [],
      githubUrl: proj.githubUrl,
      liveUrl: proj.liveUrl
    })),
    resume: { 
      hasResume: !!latestResume,
      intelligence: latestResume?.intelligence ? (latestResume.intelligence as any) : undefined
    },
    experience: {
      internshipsCount: p.degree.internships,
      workExperienceMonths: p.degree.workExperience * 12
    },
    assessments: {
      aptitudeScore: assessmentResults['APTITUDE']?.percentage ?? p.skills.employabilityScore,
      technicalScore: assessmentResults['TECHNICAL']?.percentage ?? p.skills.technicalScore,
      communicationScore: assessmentResults['COMMUNICATION']?.percentage ?? p.skills.communicationScore
    },
    targetRoleId: p.targetRole
  }

  // 3. Run Career Intelligence Engine
  const engineResult = analyzeCareerProfile(input)
  
  // 4. Save Engine Result
  await serverRepositories.career.saveEngineResult(engineResult)
  
  // Note: Predictions list saving is omitted for brevity since CareerRepository doesn't fully implement it yet,
  // but the readiness snapshot (engineResult) is saved!
  
  revalidatePath('/dashboard')
  revalidatePath('/result')
  
  return { success: true }
}

export async function refreshAnalysisAction(formData?: FormData): Promise<void> {
  const user = await requireCareerUser()
  const profileId = user.profile?.id
  
  const profile = await serverRepositories.profile.getProfile()
  if (!profile || !profileId) throw new Error('Profile not found')
  
  const semesters = await serverRepositories.academic.getSemesters()
  const projects = await serverRepositories.project.getProjects()
  const tasks = await serverRepositories.preparation.getTasks()
  const skills = await serverRepositories.skills.getSkills()
  const latestResume = await serverRepositories.resume.getLatestResume(profileId)
  const assessmentResults = await serverRepositories.assessment.getLatestResults(profileId)
  
  const input: CareerIntelligenceInput = {
    academics: {
      cgpa: profile.degree.cgpa,
      sscPercentage: profile.personal.sscPercentage,
      hscPercentage: profile.hsc.percentage,
      activeBacklogs: profile.degree.backlogs,
      intelligence: analyzeAcademicRecord({
        cgpa: profile.degree.cgpa,
        percentage: profile.degree.percentage,
        activeBacklogs: profile.degree.backlogs,
        historicalBacklogs: 0,
        semesters: semesters.map(s => ({
          id: s.id,
          termNumber: parseInt(s.name.replace('Semester ', '')) || 0,
          sgpa: s.sgpa,
          credits: s.credits
        }))
      })
    },
    skills: skills.map(s => ({
      name: s.name,
      proficiency: s.proficiencyScore
    })),
    projects: projects.map(proj => ({
      id: proj.id,
      name: proj.name,
      description: proj.description,
      technologies: proj.technology ? proj.technology.split(',').map(s => s.trim()) : [],
      githubUrl: proj.githubUrl,
      liveUrl: proj.liveUrl
    })),
    resume: { 
      hasResume: !!latestResume,
      intelligence: latestResume?.intelligence ? (latestResume.intelligence as any) : undefined
    },
    experience: {
      internshipsCount: profile.degree.internships,
      workExperienceMonths: profile.degree.workExperience * 12
    },
    assessments: {
      aptitudeScore: assessmentResults['APTITUDE']?.percentage ?? profile.skills.employabilityScore,
      technicalScore: assessmentResults['TECHNICAL']?.percentage ?? profile.skills.technicalScore,
      communicationScore: assessmentResults['COMMUNICATION']?.percentage ?? profile.skills.communicationScore
    },
    targetRoleId: profile.targetRole
  }

  const engineResult = analyzeCareerProfile(input)
  await serverRepositories.career.saveEngineResult(engineResult)
  
  revalidatePath('/dashboard')
  revalidatePath('/result')
}
