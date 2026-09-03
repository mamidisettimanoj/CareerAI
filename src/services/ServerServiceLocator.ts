import { PrismaProfileRepository } from '../repositories/prisma/PrismaProfileRepository';
import { PrismaAcademicRepository } from '../repositories/prisma/PrismaAcademicRepository';
import { PrismaCareerRepository } from '../repositories/prisma/PrismaCareerRepository';
import { PrismaProjectRepository } from '../repositories/prisma/PrismaProjectRepository';
import { PrismaResumeRepository } from '../repositories/prisma/PrismaResumeRepository';
import { ResumeStorageService } from './ResumeStorageService';
import { PrismaPreparationRepository } from '../repositories/prisma/PrismaPreparationRepository';
import { PrismaSkillRepository } from '../repositories/prisma/PrismaSkillRepository';
import { PrismaAssessmentRepository } from '../repositories/prisma/PrismaAssessmentRepository';

export const serverRepositories = {
  profile: new PrismaProfileRepository(),
  academic: new PrismaAcademicRepository(),
  career: new PrismaCareerRepository(),
  project: new PrismaProjectRepository(),
  preparation: new PrismaPreparationRepository(),
  resume: new PrismaResumeRepository(),
  skills: new PrismaSkillRepository(),
  assessment: new PrismaAssessmentRepository()
};

export const storageServices = {
  resume: new ResumeStorageService()
};

// We can also export server-specific services if needed,
// but since the current Service layer (AppService) mixes everything
// and was meant for the client, we will create focused Server Actions
// and Server Services directly instead of reusing AppService.
