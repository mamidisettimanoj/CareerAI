// src/domain/projects/engine/ProjectIntelligenceEngine.ts

import { ProjectDataInput, ProjectAnalysis, ProjectIntelligenceResult, ProjectCompleteness, ProjectDepth } from '../types/project.types';
import { normalizeSkillName } from '../../skills/engine/SkillNormalizer';

export function analyzeProjectPortfolio(inputs: ProjectDataInput[]): ProjectIntelligenceResult {
  const projects: ProjectAnalysis[] = inputs.map(analyzeSingleProject);

  const totalProjects = projects.length;
  const deployedProjects = projects.filter(p => p.hasDeployment).length;
  const repositoryProjects = projects.filter(p => p.hasRepository).length;

  // Portfolio Quality Score: sum of top 3 projects (max 100).
  // A candidate with 1 complete project (max 35) + 1 basic (15) = 50.
  // A candidate with 5 title-only projects (5 * 5 = 25) will score 15 (only top 3 count).
  const sortedScores = [...projects].map(p => p.qualityScore).sort((a, b) => b - a);
  let overallQuality = 0;
  for (let i = 0; i < Math.min(3, sortedScores.length); i++) {
    overallQuality += sortedScores[i];
  }

  overallQuality = Math.min(100, overallQuality); // hard bound

  return {
    projects,
    totalProjects,
    deployedProjects,
    repositoryProjects,
    overallQuality
  };
}

export function analyzeSingleProject(input: ProjectDataInput): ProjectAnalysis {
  let hasDescription = false;
  let hasDeployment = false;
  let hasRepository = false;
  
  if (input.description && input.description.trim().length > 10) {
    hasDescription = true;
  }

  if (input.liveUrl && input.liveUrl.startsWith('http')) {
    hasDeployment = true;
  }

  if (input.githubUrl && input.githubUrl.startsWith('http')) {
    hasRepository = true;
  }

  const normalizedTech = (input.technologies || []).map(normalizeSkillName).filter(Boolean);

  let completeness: ProjectCompleteness = 'MISSING';
  let score = 0;

  if (input.name && input.name.trim().length > 0) {
    completeness = 'MINIMAL';
    score += 5; // Title only
  }

  if (completeness === 'MINIMAL' && (hasDescription || normalizedTech.length > 0)) {
    completeness = 'PARTIAL';
    if (hasDescription) score += 5;
    if (normalizedTech.length > 0) score += 5;
  }

  if (completeness === 'PARTIAL' && hasDescription && normalizedTech.length > 0 && (hasDeployment || hasRepository)) {
    completeness = 'COMPLETE';
    if (hasDeployment) score += 10;
    if (hasRepository) score += 10;
  } else {
    // add standalone points even if not complete
    if (hasDeployment) score += 10;
    if (hasRepository) score += 10;
  }

  // Max score so far: 5 + 5 + 5 + 10 + 10 = 35.

  let depth: ProjectDepth = 'INSUFFICIENT_DATA';
  
  if (completeness === 'MINIMAL') {
    depth = 'MINIMAL';
  } else if (completeness === 'PARTIAL') {
    depth = 'BASIC';
  } else if (completeness === 'COMPLETE') {
    if (normalizedTech.length > 3 && hasRepository && hasDeployment) {
      depth = 'ADVANCED';
      score += 15; // Bonus for advanced
    } else {
      depth = 'INTERMEDIATE';
      score += 5; // Bonus for intermediate
    }
  }

  // Final clamp for single project (max theoretical is 50 here)
  score = Math.min(50, Math.max(0, score));

  return {
    id: input.id,
    name: input.name,
    completeness,
    depth,
    qualityScore: score,
    technologies: normalizedTech,
    hasDeployment,
    hasRepository,
    hasDescription
  };
}
