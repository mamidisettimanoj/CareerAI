import { LocalProfileRepository } from '@/repositories/local/LocalProfileRepository';
import { LocalAcademicRepository } from '@/repositories/local/LocalAcademicRepository';
import { LocalProjectRepository } from '@/repositories/local/LocalProjectRepository';
import { LocalSkillRepository } from '@/repositories/local/LocalSkillRepository';
import { LocalCareerRepository } from '@/repositories/local/LocalCareerRepository';
import { LocalGoalRepository } from '@/repositories/local/LocalGoalRepository';
import { LocalPreparationRepository } from '@/repositories/local/LocalPreparationRepository';
import { LocalPlacementRepository } from '@/repositories/local/LocalPlacementRepository';
import { LocalPortfolioRepository } from '@/repositories/local/LocalPortfolioRepository';
import { LocalNotificationRepository } from '@/repositories/local/LocalNotificationRepository';

export const repositories = {
  profile: new LocalProfileRepository(),
  academic: new LocalAcademicRepository(),
  project: new LocalProjectRepository(),
  skills: new LocalSkillRepository(),
  career: new LocalCareerRepository(),
  goals: new LocalGoalRepository(),
  preparation: new LocalPreparationRepository(),
  placement: new LocalPlacementRepository(),
  portfolio: new LocalPortfolioRepository(),
  notifications: new LocalNotificationRepository()
};
