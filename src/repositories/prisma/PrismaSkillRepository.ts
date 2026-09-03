import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { CandidateSkill } from '@/domain/skills/types/skill.types';

export class PrismaSkillRepository {
  async getSkills(): Promise<CandidateSkill[]> {
    const user = await getSession();
    if (!user) return [];

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: { skills: true }
    });
    
    if (!profile) return [];

    return profile.skills.map(s => ({
      id: s.id,
      name: s.name,
      normalizedName: s.name, // Can be normalized at domain level, keeping raw here
      category: s.category as any,
      proficiencyScore: s.proficiency,
      proficiencyLevel: 'BEGINNER', // Mapped fully in domain, returning stub
      evidence: []
    }));
  }

  async saveSkills(skills: { name: string; proficiency: number; category: string }[]): Promise<void> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return;

    // A real app might diff/merge. We'll simply replace for now as per Module 08 requirements
    await prisma.skill.deleteMany({ where: { profileId: profile.id } });
    
    if (skills.length > 0) {
      await prisma.skill.createMany({
        data: skills.map(s => ({
          profileId: profile.id,
          name: s.name,
          category: s.category,
          proficiency: s.proficiency
        }))
      });
    }
  }
}
