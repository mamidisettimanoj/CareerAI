import { prisma } from '@/lib/prisma';
import { ResumeCompleteness, ResumeStatus } from '@/domain/resume/types/resume.types';

export interface SaveResumeInput {
  profileId: string;
  fileUrl: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  status: ResumeStatus;
  completeness: ResumeCompleteness;
  qualityScore?: number;
  intelligence?: any;
}

export class PrismaResumeRepository {
  async getResumes(profileId: string) {
    return prisma.resume.findMany({
      where: { profileId },
      orderBy: { lastParsed: 'desc' }
    });
  }

  async getLatestResume(profileId: string) {
    return prisma.resume.findFirst({
      where: { profileId },
      orderBy: { lastParsed: 'desc' }
    });
  }

  async saveResume(input: SaveResumeInput) {
    // We only keep the most recent one for now, or just add it
    return prisma.resume.create({
      data: {
        profileId: input.profileId,
        fileUrl: input.fileUrl,
        filename: input.filename,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        status: input.status,
        completeness: input.completeness,
        qualityScore: input.qualityScore,
        intelligence: input.intelligence,
        lastParsed: new Date()
      }
    });
  }

  async deleteResume(id: string, profileId: string) {
    // verify ownership
    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume || resume.profileId !== profileId) {
      throw new Error('UNAUTHORIZED');
    }
    return prisma.resume.delete({ where: { id } });
  }
}
