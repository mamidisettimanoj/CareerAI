import { repositories } from './ServiceLocator';
import { CandidateSkill } from '@/domain/skills/types/skill.types';

export class SkillService {
  async getSkills(): Promise<CandidateSkill[]> {
    return await repositories.skills.getSkills();
  }

  async saveSkill(skill: CandidateSkill): Promise<void> {
    await repositories.skills.saveSkill(skill);
  }

  async deleteSkill(name: string): Promise<void> {
    await repositories.skills.deleteSkill(name);
  }
}

export const skillService = new SkillService();
