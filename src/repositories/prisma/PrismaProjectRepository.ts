import { prisma } from '@/lib/prisma';
import { IProjectRepository } from '../interfaces/IProjectRepository';
import { ProjectData } from '@/types';
import { getSession } from '@/lib/auth';

export class PrismaProjectRepository implements IProjectRepository {
  async getProjects(): Promise<ProjectData[]> {
    const user = await getSession();
    if (!user) return [];

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: { projects: true }
    });
    
    if (!profile) return [];

    return profile.projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      technology: p.technologies.join(', '),
      githubUrl: p.githubUrl || "",
      liveUrl: p.liveUrl || "",
      difficulty: "Medium"
    }));
  }

  async saveProjects(projects: ProjectData[]): Promise<void> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) return;

    await prisma.project.deleteMany({ where: { profileId: profile.id } });
    
    await Promise.all(projects.map(p => 
      prisma.project.create({
        data: {
          profileId: profile.id,
          name: p.name,
          description: p.description,
          technologies: p.technology.split(',').map(s => s.trim()).filter(Boolean),
          githubUrl: p.githubUrl || "",
          liveUrl: p.liveUrl || ""
        }
      })
    ));
  }

  async addProject(project: ProjectData): Promise<void> {}
  async updateProject(project: ProjectData): Promise<void> {}
  async deleteProject(id: string): Promise<void> {}
}
