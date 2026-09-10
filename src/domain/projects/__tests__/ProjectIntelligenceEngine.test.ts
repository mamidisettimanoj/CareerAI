import { describe, it, expect } from 'vitest';
import { analyzeProjectPortfolio, analyzeSingleProject } from '../engine/ProjectIntelligenceEngine';
import { ProjectDataInput } from '../types/project.types';

describe('ProjectIntelligenceEngine - Single Project', () => {
  const baseInput: ProjectDataInput = {
    id: '1',
    name: '',
    description: '',
    technologies: [],
    githubUrl: '',
    liveUrl: ''
  };

  it('1. missing / empty project', () => {
    const result = analyzeSingleProject(baseInput);
    expect(result.completeness).toBe('MISSING');
    expect(result.depth).toBe('INSUFFICIENT_DATA');
    expect(result.qualityScore).toBe(0);
  });

  it('2. minimal project (title only)', () => {
    const result = analyzeSingleProject({ ...baseInput, name: 'E-Commerce' });
    expect(result.completeness).toBe('MINIMAL');
    expect(result.depth).toBe('MINIMAL');
    expect(result.qualityScore).toBe(5);
  });

  it('3. partial project (title + description)', () => {
    const result = analyzeSingleProject({ 
      ...baseInput, 
      name: 'E-Commerce',
      description: 'A very detailed description of the project goes here.' 
    });
    expect(result.completeness).toBe('PARTIAL');
    expect(result.depth).toBe('BASIC');
    expect(result.qualityScore).toBe(10); // 5 (title) + 5 (desc)
  });

  it('4. complete project (title + desc + tech + repo)', () => {
    const result = analyzeSingleProject({
      ...baseInput,
      name: 'E-Commerce',
      description: 'A very detailed description of the project goes here.',
      technologies: ['React', 'Node'],
      githubUrl: 'https://github.com/test/test'
    });
    expect(result.completeness).toBe('COMPLETE');
    expect(result.depth).toBe('INTERMEDIATE');
    // 5(title) + 5(desc) + 5(tech) + 10(repo) + 5(intermediate bonus) = 30
    expect(result.qualityScore).toBe(30); 
  });

  it('5. advanced complete project (all fields + 4 techs)', () => {
    const result = analyzeSingleProject({
      ...baseInput,
      name: 'E-Commerce',
      description: 'A very detailed description of the project goes here.',
      technologies: ['React', 'Node', 'PostgreSQL', 'Docker'],
      githubUrl: 'https://github.com/test/test',
      liveUrl: 'https://vercel.com/test'
    });
    expect(result.completeness).toBe('COMPLETE');
    expect(result.depth).toBe('ADVANCED');
    // 5(title) + 5(desc) + 5(tech) + 10(repo) + 10(live) + 15(advanced bonus) = 50
    expect(result.qualityScore).toBe(50);
  });

  it('6. technology normalization integration', () => {
    const result = analyzeSingleProject({
      ...baseInput,
      technologies: ['js', 'nodejs', 'react.js']
    });
    expect(result.technologies).toContain('JavaScript');
    expect(result.technologies).toContain('Node.js');
    expect(result.technologies).toContain('React');
  });

  it('7. missing optional fields does not imply bad quality', () => {
    // Only has liveUrl, but no githubUrl
    const result = analyzeSingleProject({
      ...baseInput,
      name: 'UI Clone',
      description: 'Cloned a famous UI for practice purposes.',
      technologies: ['CSS'],
      liveUrl: 'https://vercel.com/test'
    });
    expect(result.completeness).toBe('COMPLETE'); // It is complete enough
    expect(result.hasDeployment).toBe(true);
    expect(result.hasRepository).toBe(false);
  });

  it('8. invalid URLs do not count as evidence', () => {
    const result = analyzeSingleProject({
      ...baseInput,
      name: 'Test',
      githubUrl: 'javascript:alert(1)',
      liveUrl: 'data:text/html,...'
    });
    expect(result.hasDeployment).toBe(false);
    expect(result.hasRepository).toBe(false);
  });
});

describe('ProjectIntelligenceEngine - Portfolio', () => {
  it('9. portfolio quality sum limits to top 3', () => {
    const result = analyzeProjectPortfolio([
      { id: '1', name: 'A', description: 'Detailed desc 1', technologies: ['React'], githubUrl: 'https://github' }, // ~30
      { id: '2', name: 'B', description: 'Detailed desc 2', technologies: ['Node'], githubUrl: 'https://github' }, // ~30
      { id: '3', name: 'C', description: 'Detailed desc 3', technologies: ['SQL'], githubUrl: 'https://github' }, // ~30
      { id: '4', name: 'D', description: 'Detailed desc 4', technologies: ['AWS'], githubUrl: 'https://github' }, // ~30
      { id: '5', name: 'E', description: 'Detailed desc 5', technologies: ['Docker'], githubUrl: 'https://github' } // ~30
    ]);
    
    // Max 100 bound. Sum of top 3 is 90.
    expect(result.overallQuality).toBe(90);
    expect(result.totalProjects).toBe(5);
  });

  it('10. 5 empty projects do not outrank 1 advanced project', () => {
    const emptyPort = analyzeProjectPortfolio([
      { id: '1', name: 'A', description: '', technologies: [] }, // 5
      { id: '2', name: 'B', description: '', technologies: [] }, // 5
      { id: '3', name: 'C', description: '', technologies: [] }, // 5
      { id: '4', name: 'D', description: '', technologies: [] }, // 5
      { id: '5', name: 'E', description: '', technologies: [] }, // 5
    ]);
    // Top 3 = 15 points
    expect(emptyPort.overallQuality).toBe(15);

    const advancedPort = analyzeProjectPortfolio([
      { 
        id: '1', name: 'A', description: 'Detailed', technologies: ['A','B','C','D'], 
        githubUrl: 'https://github', liveUrl: 'https://live' 
      }
    ]); // 50 points
    
    expect(advancedPort.overallQuality).toBeGreaterThan(emptyPort.overallQuality);
  });

  it('11. overall quality bounded at 100', () => {
    const result = analyzeProjectPortfolio([
      { 
        id: '1', name: 'A', description: 'Very Detailed Description', technologies: ['A','B','C','D'], 
        githubUrl: 'https://github', liveUrl: 'https://live' 
      }, // 50
      { 
        id: '2', name: 'B', description: 'Very Detailed Description', technologies: ['A','B','C','D'], 
        githubUrl: 'https://github', liveUrl: 'https://live' 
      }, // 50
      { 
        id: '3', name: 'C', description: 'Very Detailed Description', technologies: ['A','B','C','D'], 
        githubUrl: 'https://github', liveUrl: 'https://live' 
      } // 50
    ]);
    expect(result.overallQuality).toBe(100); // 150 clamped to 100
  });

  it('12. stats generation', () => {
    const result = analyzeProjectPortfolio([
      { id: '1', name: 'A', description: '', technologies: [], liveUrl: 'https://live' },
      { id: '2', name: 'B', description: '', technologies: [], githubUrl: 'https://github' },
    ]);
    expect(result.deployedProjects).toBe(1);
    expect(result.repositoryProjects).toBe(1);
    expect(result.totalProjects).toBe(2);
  });
});
