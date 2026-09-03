import { repositories } from './ServiceLocator';
import { analyzeCareerProfile } from '@/domain/career-intelligence/engine/CareerIntelligenceEngine';
import { analyzeAcademicRecord } from '@/domain/academic/engine/AcademicIntelligenceEngine';
import { IntelligenceResult, PredictionResult } from '@/types';


export class CareerService {
  /**
   * Generates a new career readiness analysis and saves it.
   */
  public async generateAnalysis(): Promise<IntelligenceResult | null> {
    // In a real backend, we wouldn't load the entire AppState, but the engine expects it right now.
    // For Phase 2, the engine signature should be refactored to take individual domain objects.
    const profile = await repositories.profile.getProfile();
    if (!profile) return null;

    const fullState = {
      profile: profile,
      semesters: await repositories.academic.getSemesters(),
      projects: await repositories.project.getProjects(),
      certifications: [],
      skills: await repositories.skills.getSkills(),
      predictions: await repositories.career.getPredictions(),
      tasks: await repositories.preparation.getTasks(),
      engineResult: (await repositories.career.getEngineResult()) || undefined,
      settings: { theme: 'dark' as const, reducedAnimations: false }
    };

    try {
      const input = {
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
            semesters: fullState.semesters.map(s => ({
              id: s.id,
              termNumber: parseInt(s.name.replace('Semester ', '')) || 0,
              sgpa: s.sgpa,
              credits: s.credits
            }))
          })
        },
        skills: fullState.skills.map(s => ({
          name: s.name,
          proficiency: s.proficiencyScore
        })),
        projects: fullState.projects.map(proj => ({
          id: proj.id,
          name: proj.name,
          description: proj.description,
          technologies: proj.technology ? proj.technology.split(',').map(s => s.trim()) : [],
          githubUrl: proj.githubUrl,
          liveUrl: proj.liveUrl
        })),
        resume: { 
          hasResume: false,
        },
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

      const result = analyzeCareerProfile(input);
      
      // Save through the repository
      await repositories.career.saveEngineResult(result);
      
      // Also generate a prediction snapshot
      const currentPredictions = await repositories.career.getPredictions();
      const newPrediction = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        readinessScore: result.readiness.overallScore,
        cgpa: fullState.profile.degree.cgpa,
        aptitude: fullState.profile.skills.employabilityScore,
        placementEstimate: result.readiness.overallScore,
        targetRole: fullState.profile.targetRole
      };
      
      await repositories.career.savePredictions([newPrediction, ...currentPredictions]);

      return result;
    } catch (error) {
      console.error('Failed to generate analysis', error);
      throw new Error('Analysis generation failed.');
    }
  }

  public async getCachedAnalysis(): Promise<IntelligenceResult | null> {
    return await repositories.career.getEngineResult();
  }
}

export const careerService = new CareerService();
