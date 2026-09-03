import { IAssessmentRepository } from '../interfaces/IAssessmentRepository';
import { prisma } from '@/lib/prisma';
import { AssessmentCategory } from '@/domain/assessment/types/assessment.types';

export class PrismaAssessmentRepository implements IAssessmentRepository {
  async getAvailableAssessments(): Promise<any[]> {
    return prisma.assessmentTemplate.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            _count: {
              select: { questions: true }
            }
          }
        }
      }
    });
  }

  async getAssessmentVersion(versionId: string): Promise<any> {
    const version = await prisma.assessmentVersion.findUnique({
      where: { id: versionId },
      include: {
        assessment: true,
        questions: {
          include: {
            options: true // Options include isCorrect, which must be stripped before sending to client
          }
        }
      }
    });
    return version;
  }

  async startAttempt(profileId: string, versionId: string): Promise<any> {
    return prisma.assessmentAttempt.create({
      data: {
        profileId,
        versionId,
        status: 'IN_PROGRESS'
      }
    });
  }

  async getAttempt(attemptId: string): Promise<any> {
    return prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        version: {
          include: {
            assessment: true
          }
        },
        answers: true,
        result: true
      }
    });
  }

  async submitAttempt(attemptId: string, answers: any[], resultData: any): Promise<any> {
    return prisma.$transaction(async (tx) => {
      // 1. Create answers
      for (const answer of answers) {
        await tx.assessmentAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId: answer.questionId
            }
          },
          update: {
            optionId: answer.optionId
          },
          create: {
            attemptId,
            questionId: answer.questionId,
            optionId: answer.optionId
          }
        });
      }

      // 2. Create Result
      await tx.assessmentResult.upsert({
        where: { attemptId },
        update: {
          score: resultData.score,
          maxScore: resultData.maxScore,
          percentage: resultData.percentage,
          attempted: resultData.attempted,
          correct: resultData.correct,
          incorrect: resultData.incorrect,
          unanswered: resultData.unanswered,
          categoryScores: resultData.categoryScores || {}
        },
        create: {
          attemptId,
          score: resultData.score,
          maxScore: resultData.maxScore,
          percentage: resultData.percentage,
          attempted: resultData.attempted,
          correct: resultData.correct,
          incorrect: resultData.incorrect,
          unanswered: resultData.unanswered,
          categoryScores: resultData.categoryScores || {}
        }
      });

      // 3. Update Attempt Status
      const attempt = await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'COMPLETED',
          submissionTime: new Date()
        },
        include: {
          result: true
        }
      });

      return attempt;
    });
  }

  async getLatestResultsByCategory(profileId: string, category: AssessmentCategory): Promise<any[]> {
    const attempts = await prisma.assessmentAttempt.findMany({
      where: {
        profileId,
        status: 'COMPLETED',
        version: {
          assessment: {
            category: category as any
          }
        }
      },
      orderBy: {
        submissionTime: 'asc' // chronological
      },
      include: {
        result: true
      }
    });

    return attempts.map(a => a.result).filter(Boolean);
  }

  async getLatestResults(profileId: string): Promise<Record<string, any>> {
    // Get the latest completed attempt for EACH category
    // In SQL this is a window function, in Prisma we'll fetch all completed and group in JS.
    // Or we just fetch all categories.
    const attempts = await prisma.assessmentAttempt.findMany({
      where: {
        profileId,
        status: 'COMPLETED'
      },
      orderBy: {
        submissionTime: 'desc'
      },
      include: {
        result: true,
        version: {
          include: { assessment: true }
        }
      }
    });

    const categoryMap: Record<string, any> = {};
    for (const attempt of attempts) {
      if (attempt.result && attempt.version) {
        const cat = attempt.version.assessment.category;
        if (!categoryMap[cat]) {
          categoryMap[cat] = attempt.result;
        }
      }
    }
    return categoryMap;
  }
}
