import { CandidateSkill } from '@/domain/skills/types/skill.types';

export class LocalSkillRepository {
  async getSkills(): Promise<CandidateSkill[]> {
    return [];
  }
  async saveSkills(skills: { name: string; proficiency: number; category: string }[]): Promise<void> {}
}
