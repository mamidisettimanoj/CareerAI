import { prisma } from '@/lib/prisma';
import { IAcademicRepository } from '../interfaces/IAcademicRepository';
import { SemesterData } from '@/types';
import { getSession } from '@/lib/auth';

export class PrismaAcademicRepository implements IAcademicRepository {
  async getSemesters(): Promise<SemesterData[]> {
    const user = await getSession();
    if (!user) return [];

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: {
        education: {
          include: { semesters: true }
        }
      }
    });
    
    if (!profile || profile.education.length === 0) return [];
    
    const primaryEducation = profile.education[0];
    
    return primaryEducation.semesters.map(sem => ({
      id: sem.id,
      name: `Semester ${sem.termNumber}`,
      sgpa: sem.sgpa || 0,
      credits: sem.credits || 0
    }));
  }

  async saveSemesters(semesters: SemesterData[]): Promise<void> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: { education: { include: { semesters: true } } }
    });
    
    if (!profile || profile.education.length === 0) return;

    const primaryEducationId = profile.education[0].id;

    // A real implementation would diff. For now, delete all and recreate.
    await prisma.semester.deleteMany({
      where: { educationId: primaryEducationId }
    });

    if (semesters.length > 0) {
      await prisma.semester.createMany({
        data: semesters.map((sem, idx) => ({
          educationId: primaryEducationId,
          termNumber: idx + 1,
          sgpa: sem.sgpa,
          credits: sem.credits
        }))
      });
    }
  }

  async getCalculations(): Promise<any> {
    return null;
  }
}
