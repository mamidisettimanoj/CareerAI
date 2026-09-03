import { IProfileRepository } from '../interfaces/IProfileRepository';
import { UserProfile } from '@/types';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export class PrismaProfileRepository implements IProfileRepository {
  async getProfile(): Promise<UserProfile | null> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: {
        education: true,
        skills: true,
      }
    });

    if (!profile) return null;

    // Convert from Prisma Profile to domain UserProfile
    // This requires a mapper since the schema normalized the AppState blob.
    // For the sake of the interface contract, this is a conceptual mapping.
    
    return {
      personal: {
        gender: "Not specified",
        sscBoard: "Not specified",
        sscPercentage: 0,
        academicYear: "Not specified",
      },
      hsc: {
        board: "Not specified",
        stream: "Not specified",
        percentage: 0,
      },
      degree: {
        type: profile.education[0]?.degreeType || "",
        branch: profile.education[0]?.branch || "",
        percentage: profile.education[0]?.percentage || 0,
        cgpa: profile.education[0]?.cgpa || 0,
        workExperience: 0,
        internships: 0,
        backlogs: profile.education[0]?.activeBacklogs || 0,
      },
      mba: {
        specialization: "",
        percentage: 0,
      },
      skills: {
        employabilityScore: profile.skills.find(s => s.name === "Employability")?.proficiency || 0,
        technicalScore: profile.skills.find(s => s.name === "Technical")?.proficiency || 0,
        communicationScore: profile.skills.find(s => s.name === "Communication")?.proficiency || 0,
        projectsCount: 0,
        certificationsCount: 0,
      },
      targetRole: profile.targetRole || "Not specified",
    };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    const dbProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        firstName: "Student", // placeholder since UserProfile didn't have names
        lastName: "User",
        targetRole: profile.targetRole,
      },
      create: {
        userId: user.id,
        firstName: "Student",
        lastName: "User",
        targetRole: profile.targetRole,
      }
    });

    // Update education and skills conceptually...
    // (Full mapping left for Phase 2 integration when authentication is active)
  }

  async deleteProfile(): Promise<void> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    await prisma.profile.delete({ where: { userId: user.id } });
  }
}
