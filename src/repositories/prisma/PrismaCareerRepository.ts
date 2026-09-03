import { prisma } from '@/lib/prisma';
import { ICareerRepository } from '../interfaces/ICareerRepository';
import { IntelligenceResult, PredictionResult } from '@/types';
import { getSession } from '@/lib/auth';

export class PrismaCareerRepository implements ICareerRepository {
  async getEngineResult(): Promise<IntelligenceResult | null> {
    const user = await getSession();
    if (!user) return null;

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: { readinessSnapshots: { orderBy: { timestamp: 'desc' }, take: 1 } }
    });
    
    if (!profile || profile.readinessSnapshots.length === 0) return null;

    const snapshot = profile.readinessSnapshots[0];
    return {
      version: '2.0',
      timestamp: snapshot.timestamp.toISOString(),
      readiness: {
        overallScore: snapshot.overallScore,
        dimensions: {
          academic: { score: snapshot.academicScore, max: 100, contribution: 0, explanation: '', dataCompleteness: 'COMPLETE' },
          technical: { score: snapshot.technicalScore, max: 100, contribution: 0, explanation: '', dataCompleteness: 'COMPLETE' },
          project: { score: snapshot.projectScore, max: 100, contribution: 0, explanation: '', dataCompleteness: 'COMPLETE' },
          resume: { score: snapshot.resumeScore, max: 100, contribution: 0, explanation: '', dataCompleteness: 'COMPLETE' },
          aptitude: { score: 0, max: 100, contribution: 0, explanation: '', dataCompleteness: 'MISSING' },
          interview: { score: snapshot.interviewScore, max: 100, contribution: 0, explanation: '', dataCompleteness: 'COMPLETE' }
        },
        topStrengths: snapshot.topStrengths,
        priorityImprovements: snapshot.priorityImprovements.map(a => ({ area: a, action: a, reason: 'Generated from snapshot', priority: 'MEDIUM' as const }))
      },
      eligibility: [],
      summary: "Generated from snapshot.",
      sevenDayPlan: [],
      thirtyDayRoadmap: []
    };
  }

  async saveEngineResult(result: IntelligenceResult): Promise<void> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return;

    await prisma.readinessSnapshot.create({
      data: {
        profileId: profile.id,
        overallScore: result.readiness.overallScore,
        academicScore: result.readiness.dimensions.academic.score,
        technicalScore: result.readiness.dimensions.technical.score,
        projectScore: result.readiness.dimensions.project.score,
        resumeScore: result.readiness.dimensions.resume.score,
        interviewScore: result.readiness.dimensions.interview.score,
        topStrengths: result.readiness.topStrengths,
        priorityImprovements: result.readiness.priorityImprovements.map(p => p.area)
      }
    });
  }

  async getPredictions(): Promise<PredictionResult[]> { return []; }
  async savePredictions(predictions: PredictionResult[]): Promise<void> {}
  async addPrediction(prediction: PredictionResult): Promise<void> {}
}
