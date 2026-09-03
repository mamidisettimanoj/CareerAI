import { EligibilityClient } from '@/components/eligibility/EligibilityClient';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { CareerIntelligenceInput } from '@/domain/career-intelligence/types/intelligence.types';
import { analyzeAcademicRecord } from '@/domain/academic/engine/AcademicIntelligenceEngine';
import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Eligibility() {
  await requireUser();
  const profile = await serverRepositories.profile.getProfile();
  
  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Profile Required</h2>
        <p className="text-muted-foreground">Please complete your profile in the Predict section first.</p>
      </div>
    );
  }
  
  const projects = await serverRepositories.project.getProjects();
  
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
        semesters: [] // If eligibility needs semesters, we can load them, but usually eligibility is just CGPA/Backlogs
      })
    },
    skills: [],
    projects: projects.map(proj => ({
      id: proj.id,
      name: proj.name,
      description: proj.description,
      technologies: proj.technology ? proj.technology.split(',').map(s => s.trim()) : [],
      githubUrl: proj.githubUrl,
      liveUrl: proj.liveUrl
    })),
    resume: { hasResume: false },
    experience: {
      internshipsCount: profile.degree.internships,
      workExperienceMonths: profile.degree.workExperience * 12
    },
    assessments: {
      aptitudeScore: profile.skills.employabilityScore,
      technicalScore: profile.skills.technicalScore,
      communicationScore: profile.skills.communicationScore
    },
    targetRoleId: profile.targetRole
  };

  return <EligibilityClient input={input} />;
}


