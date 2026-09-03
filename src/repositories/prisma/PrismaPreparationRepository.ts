import { prisma } from '@/lib/prisma';
import { IPreparationRepository } from '../interfaces/IPreparationRepository';
import { RoadmapDef, PreparationTaskDef } from '@/domain/preparation/types/preparation.types';

export class PrismaPreparationRepository implements IPreparationRepository {
  
  async getCurrentRoadmap(profileId: string): Promise<RoadmapDef | null> {
    const roadmap = await prisma.roadmap.findFirst({
      where: { profileId, status: 'ACTIVE' },
      orderBy: { generatedAt: 'desc' },
      include: { tasks: true }
    });

    if (!roadmap) return null;

    return {
      id: roadmap.id,
      profileId: roadmap.profileId,
      version: roadmap.version,
      targetRole: roadmap.targetRole || undefined,
      status: roadmap.status as any,
      generatedAt: roadmap.generatedAt,
      sourceVersionMetadata: roadmap.sourceVersionMetadata as any,
      tasks: roadmap.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        type: t.type as any,
        priority: t.priority as any,
        horizon: t.horizon as any,
        status: t.status as any,
        estimatedMinutes: t.estimatedMinutes,
        justification: t.justification || undefined,
        dependencies: t.dependencies
      }))
    };
  }

  async saveRoadmap(roadmap: RoadmapDef): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Archive old active roadmaps
      await tx.roadmap.updateMany({
        where: { profileId: roadmap.profileId, status: 'ACTIVE' },
        data: { status: 'ARCHIVED' }
      });

      // Create new roadmap
      const created = await tx.roadmap.create({
        data: {
          id: roadmap.id,
          profileId: roadmap.profileId,
          version: roadmap.version,
          targetRole: roadmap.targetRole,
          status: roadmap.status,
          generatedAt: roadmap.generatedAt,
          sourceVersionMetadata: roadmap.sourceVersionMetadata || {}
        }
      });

      // Insert tasks
      if (roadmap.tasks.length > 0) {
        await tx.preparationTask.createMany({
          data: roadmap.tasks.map(t => ({
            id: t.id,
            roadmapId: created.id,
            profileId: roadmap.profileId,
            title: t.title,
            description: t.description,
            type: t.type,
            priority: t.priority,
            horizon: t.horizon,
            status: t.status,
            estimatedMinutes: t.estimatedMinutes,
            justification: t.justification,
            dependencies: t.dependencies
          }))
        });
      }
    });
  }

  async updateTaskStatus(taskId: string, profileId: string, status: string): Promise<void> {
    // Ensures ownership safely
    const task = await prisma.preparationTask.findFirst({
      where: { id: taskId, profileId }
    });

    if (!task) throw new Error('Task not found or unauthorized');

    await prisma.preparationTask.update({
      where: { id: taskId },
      data: { status }
    });
  }

  async getTasks(profileId?: string): Promise<PreparationTaskDef[]> {
    if (!profileId) return [];
    const roadmap = await this.getCurrentRoadmap(profileId);
    return roadmap?.tasks || [];
  }
}
