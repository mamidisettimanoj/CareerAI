import { IPreparationRepository } from '../interfaces/IPreparationRepository';
import { RoadmapDef, PreparationTaskDef } from '@/domain/preparation/types/preparation.types';

export class LocalPreparationRepository implements IPreparationRepository {
  async getCurrentRoadmap(profileId: string): Promise<RoadmapDef | null> {
    return null;
  }
  
  async saveRoadmap(roadmap: RoadmapDef): Promise<void> {}
  
  async updateTaskStatus(taskId: string, profileId: string, status: string): Promise<void> {}

  async getTasks(profileId?: string): Promise<PreparationTaskDef[]> {
    return [];
  }
}
