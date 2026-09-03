import { RoadmapDef, PreparationTaskDef } from '@/domain/preparation/types/preparation.types';

export interface IPreparationRepository {
  getCurrentRoadmap(profileId: string): Promise<RoadmapDef | null>;
  saveRoadmap(roadmap: RoadmapDef): Promise<void>;
  updateTaskStatus(taskId: string, profileId: string, status: string): Promise<void>;
  getTasks(profileId?: string): Promise<PreparationTaskDef[]>; // Keeping legacy signature compatible but updated
}
