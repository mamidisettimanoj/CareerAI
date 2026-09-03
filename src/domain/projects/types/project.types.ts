// src/domain/projects/types/project.types.ts

export type ProjectCompleteness = 'MISSING' | 'MINIMAL' | 'PARTIAL' | 'COMPLETE';
export type ProjectDepth = 'INSUFFICIENT_DATA' | 'MINIMAL' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

export interface ProjectDataInput {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export interface ProjectAnalysis {
  id: string;
  name: string;
  completeness: ProjectCompleteness;
  depth: ProjectDepth;
  qualityScore: number; // 0-100
  technologies: string[]; // normalized names
  hasDeployment: boolean;
  hasRepository: boolean;
  hasDescription: boolean;
}

export interface ProjectIntelligenceResult {
  projects: ProjectAnalysis[];
  overallQuality: number; // 0-100 average or sum metric
  totalProjects: number;
  deployedProjects: number;
  repositoryProjects: number;
}
