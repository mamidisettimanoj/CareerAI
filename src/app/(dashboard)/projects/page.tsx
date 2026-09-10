"use client";

import { useState, useEffect } from 'react';
import { ProjectsClient } from '@/components/projects/ProjectsClient';
import { repositories } from '@/services/ServiceLocator';
import { analyzeProjectPortfolio } from '@/domain/projects/engine/ProjectIntelligenceEngine';
import { ProjectData } from '@/types';

export default function Projects() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [intel, setIntel] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      const proj = await repositories.project.getProjects();
      const inputs = proj.map(p => ({
        id: p.id,
        name: p.title || p.name || 'Untitled',
        description: p.description,
        technologies: p.technologies && p.technologies.length > 0 ? p.technologies : (p.technology ? p.technology.split(',').map(s => s.trim()) : []),
        githubUrl: p.githubUrl,
        liveUrl: p.demoUrl || p.liveUrl
      }));
      const intelligence = analyzeProjectPortfolio(inputs);
      
      setProjects(proj);
      setIntel(intelligence);
      setLoaded(true);
    }
    loadData();
  }, []);

  if (!loaded || !intel) {
    return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">Loading...</div>;
  }

  return <ProjectsClient initialProjects={projects} intelligenceResult={intel} />;
}
