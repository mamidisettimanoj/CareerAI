import { CandidateSkill, SkillProficiencyLevel } from '@/domain/skills/types/skill.types';
import { db } from '@/lib/db';

export class LocalSkillRepository {
  async getSkills(): Promise<CandidateSkill[]> {
    if (!db) return [];
    try {
      return await db.skills.toArray();
    } catch (error) {
      console.error("Failed to get skills from DB", error);
      return [];
    }
  }

  async saveSkills(skills: { name: string; proficiency: number; category: string }[]): Promise<void> {
    if (!db) return;
    try {
      const candidateSkills: CandidateSkill[] = skills.map(s => ({
        name: s.name,
        normalizedName: s.name.toLowerCase(),
        category: s.category as any,
        proficiencyScore: s.proficiency,
        proficiencyLevel: this.getProficiencyLevel(s.proficiency),
        evidence: [{ source: 'SELF_REPORTED', strength: 'MEDIUM' }]
      }));
      
      await db.transaction('rw', db.skills, async () => {
        await db.skills.clear();
        await db.skills.bulkPut(candidateSkills);
      });
    } catch (error) {
      console.error("Failed to save skills to DB", error);
    }
  }

  async saveSkill(skill: CandidateSkill): Promise<void> {
    if (!db) return;
    try {
      skill.proficiencyLevel = this.getProficiencyLevel(skill.proficiencyScore);
      if (!skill.evidence) skill.evidence = [{ source: 'SELF_REPORTED', strength: 'MEDIUM' }];
      await db.skills.put(skill);
    } catch (error) {
      console.error("Failed to save individual skill to DB", error);
    }
  }

  async deleteSkill(name: string): Promise<void> {
    if (!db) return;
    try {
      await db.skills.delete(name);
    } catch (error) {
      console.error("Failed to delete individual skill from DB", error);
    }
  }
  
  private getProficiencyLevel(score: number): SkillProficiencyLevel {
    if (score >= 80) return 'EXPERT';
    if (score >= 60) return 'ADVANCED';
    if (score >= 40) return 'INTERMEDIATE';
    return 'BEGINNER';
  }
}
