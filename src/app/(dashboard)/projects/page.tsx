import { ProjectsClient } from '@/components/projects/ProjectsClient';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { requireUser } from '@/lib/auth';
import { analyzeProjectPortfolio } from '@/domain/projects/engine/ProjectIntelligenceEngine';

export default async function Projects() {
  await requireUser();
  const projects = await serverRepositories.project.getProjects();
  
  const intel = analyzeProjectPortfolio(projects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    technologies: p.technology ? p.technology.split(',').map(s => s.trim()) : [],
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl
  })));
  
  return <ProjectsClient initialProjects={projects} intelligenceResult={intel} />;
}


