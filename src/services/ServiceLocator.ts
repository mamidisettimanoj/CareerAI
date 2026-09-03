import { LocalProfileRepository } from '../repositories/local/LocalProfileRepository';
import { LocalAcademicRepository } from '../repositories/local/LocalAcademicRepository';
import { LocalCareerRepository } from '../repositories/local/LocalCareerRepository';
import { LocalProjectRepository } from '../repositories/local/LocalProjectRepository';
import { LocalPreparationRepository } from '../repositories/local/LocalPreparationRepository';
import { LocalSkillRepository } from '../repositories/local/LocalSkillRepository';

// Phase 1: Provide LocalStorage implementations
export const repositories = {
  profile: new LocalProfileRepository(),
  academic: new LocalAcademicRepository(),
  career: new LocalCareerRepository(),
  project: new LocalProjectRepository(),
  preparation: new LocalPreparationRepository(),
  skills: new LocalSkillRepository()
};
