import { SkillsClient } from '@/components/skills/SkillsClient';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { requireUser } from '@/lib/auth';
import { getRoleDefinition } from '@/domain/career-intelligence/config/roleCatalog';
import { buildSkillIntelligence } from '@/domain/skills/engine/SkillIntelligenceEngine';

export default async function Skills() {
  await requireUser();
  const profile = await serverRepositories.profile.getProfile();
  const skills = await serverRepositories.skills.getSkills();
  const projects = await serverRepositories.project.getProjects();
  
  const skillIntel = buildSkillIntelligence(
    skills.map(s => ({ name: s.name, proficiency: s.proficiencyScore })),
    projects.map(p => ({ projectId: p.id, technologies: p.technology ? p.technology.split(',').map((t: string) => t.trim()) : [] }))
  );

  return (
    <SkillsClient 
      initialTargetRole={profile?.targetRole || null} 
      intelligenceResult={skillIntel} 
    />
  );
}


