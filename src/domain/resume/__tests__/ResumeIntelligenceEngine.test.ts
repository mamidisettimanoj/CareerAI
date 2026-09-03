import { describe, it, expect } from 'vitest';
import { analyzeResumeText } from '../engine/ResumeIntelligenceEngine';
import { isSupportedMimeType } from '../engine/ResumeExtractor';
import { CareerIntelligenceInput } from '../../career-intelligence/types/intelligence.types';

describe('Resume Intelligence Subsystem', () => {
  
  describe('Validation & Security', () => {
    it('1. should support application/pdf MIME type', () => {
      expect(isSupportedMimeType('application/pdf')).toBe(true);
    });
    
    it('2. should reject unsupported MIME type', () => {
      expect(isSupportedMimeType('text/html')).toBe(false);
      expect(isSupportedMimeType('application/octet-stream')).toBe(false);
    });
  });

  describe('Extraction & Basic Analysis', () => {
    it('3. should return FAILED for empty text', () => {
      const result = analyzeResumeText('');
      expect(result.status).toBe('FAILED');
      expect(result.completeness).toBe('MISSING');
      expect(result.qualityScore).toBe(0);
    });

    it('4. should process valid text', () => {
      const result = analyzeResumeText('John Doe. Student.');
      expect(result.status).toBe('PROCESSED');
      expect(result.wordCount).toBe(3);
    });
  });

  describe('Section Detection', () => {
    it('5. should detect education section', () => {
      const result = analyzeResumeText('I have a Bachelor degree from a University.');
      expect(result.sections.education).toBe(true);
    });

    it('6. should detect experience section', () => {
      const result = analyzeResumeText('Work History: 2 years employment.');
      expect(result.sections.experience).toBe(true);
    });

    it('7. should detect skills section', () => {
      const result = analyzeResumeText('Technical Skills: React, Node');
      expect(result.sections.skills).toBe(true);
    });

    it('8. should detect projects section', () => {
      const result = analyzeResumeText('Academic Projects: E-commerce app');
      expect(result.sections.projects).toBe(true);
    });

    it('9. should report missing sections', () => {
      const result = analyzeResumeText('Just a random text');
      expect(result.missingSections.length).toBeGreaterThan(0);
      expect(result.missingSections).toContain('contact');
    });
  });

  describe('Completeness', () => {
    it('10. should return MINIMAL if only contact info is present', () => {
      const result = analyzeResumeText('Contact me at test@example.com');
      expect(result.completeness).toBe('MINIMAL');
    });

    it('11. should return PARTIAL if contact + education + skills', () => {
      const result = analyzeResumeText('Email test@example.com. Education: B.Tech. Skills: Java.');
      expect(result.completeness).toBe('PARTIAL');
    });

    it('12. should return COMPLETE if contact + edu + skills + projects/experience', () => {
      const result = analyzeResumeText('test@example.com. B.Tech degree. Skills: Java. Work Experience: Internship.');
      expect(result.completeness).toBe('COMPLETE');
    });
  });

  describe('Quality', () => {
    it('13. should have deterministic quality based on sections', () => {
      const result = analyzeResumeText('test@example.com. B.Tech degree. Skills: Java. Work Experience: Internship. Personal Projects: App. Certifications: AWS. Achievements: First place.');
      // contact=10, edu+skills=30, exp/proj=30, certifications=10, achievements=10 -> 90
      expect(result.qualityScore).toBe(90); // wordcount < 300 so no bonus
    });

    it('14. should cap quality at 100', () => {
      const longText = Array(400).fill('word').join(' ') + ' test@example.com degree skills experience projects certifications achievements';
      const result = analyzeResumeText(longText);
      expect(result.qualityScore).toBe(100);
    });

    it('15. should produce warnings for too short resumes', () => {
      const result = analyzeResumeText('test@example.com');
      expect(result.warnings).toContain('Resume is very short. Provide more details.');
    });
  });

  describe('Evidence Extraction', () => {
    it('16. should detect and normalize technical skills', () => {
      const result = analyzeResumeText('I know react and node.js');
      const skills = result.evidence.filter(e => e.type === 'SKILL').map(e => e.value);
      expect(skills).toContain('React');
      expect(skills).toContain('Node.js');
    });
  });

  describe('Profile Consistency', () => {
    const mockProfile: CareerIntelligenceInput = {
      academics: { cgpa: 8.5, sscPercentage: 90, hscPercentage: 90, activeBacklogs: 0 },
      skills: [
        { name: 'React', proficiency: 80 },
        { name: 'Docker', proficiency: 60 }
      ],
      projects: [
        { id: '1', name: 'Campus Placement Portal', description: 'desc', technologies: [], githubUrl: '', liveUrl: '' }
      ],
      resume: { hasResume: true },
      experience: { internshipsCount: 0, workExperienceMonths: 0 },
      assessments: { aptitudeScore: 0, technicalScore: 0, communicationScore: 0 }
    };

    it('17. should find matching skills', () => {
      const result = analyzeResumeText('I have experience in React.', mockProfile);
      expect(result.consistency!.matchingSkills).toContain('react'); // normalized to lower
    });

    it('18. should find profile skills not in resume', () => {
      const result = analyzeResumeText('I only know React.', mockProfile);
      expect(result.consistency!.profileSkillsNotInResume).toContain('docker');
    });

    it('19. should find matching projects', () => {
      const result = analyzeResumeText('Built Campus Placement Portal.', mockProfile);
      expect(result.consistency!.matchingProjects).toContain('Campus Placement Portal');
    });

    it('20. should check academic consistency', () => {
      const result = analyzeResumeText('My CGPA is 8.5.', mockProfile);
      expect(result.consistency!.academicMatch).toBe('CONSISTENT');
    });
  });
});
