/**
 * Integration boundary for future AI features (Phase 3).
 * Do NOT implement external API calls here yet.
 */
export interface IAIGateway {
  analyzeResume(resumeText: string): Promise<any>;
  generateCareerPath(profile: any): Promise<any>;
  suggestProjects(skills: string[]): Promise<any>;
}
