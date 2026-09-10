import { describe, it, expect } from 'vitest';
import { generatePreparationPlan } from '../engine/PreparationPlanEngine';
import { PreparationPlanInput, PreparationTaskDef } from '../types/preparation.types';

describe('Preparation Intelligence Engine', () => {
  
  const createMockInput = (overrides = {}): PreparationPlanInput => ({
    targetRole: 'Software Engineer',
    readinessScore: 50,
    skills: [],
    projects: [],
    resume: { hasResume: true, score: 85 },
    assessments: {},
    academics: { cgpa: 8.0, activeBacklogs: 0 },
    availabilityHoursPerWeek: 10,
    existingTasks: [],
    ...overrides
  });

  describe('Gap Detection & Generation', () => {
    it('1. should generate Profile Completion task if Resume is missing', () => {
      const input = createMockInput({ resume: { hasResume: false } });
      const plan = generatePreparationPlan(input);
      
      const task = plan.find(t => t.type === 'PROFILE_COMPLETION');
      expect(task).toBeDefined();
      expect(task?.horizon).toBe(7); // High priority blocker
    });

    it('2. should generate Resume Improvement if score is < 70', () => {
      const input = createMockInput({ resume: { hasResume: true, score: 60 } });
      const plan = generatePreparationPlan(input);
      
      const task = plan.find(t => t.type === 'RESUME_IMPROVEMENT');
      expect(task).toBeDefined();
      expect(task?.priority).toBe('HIGH');
    });

    it('3. should generate Eligibility Remediation for active backlogs', () => {
      const input = createMockInput({ academics: { cgpa: 6.5, activeBacklogs: 2 } });
      const plan = generatePreparationPlan(input);
      
      const task = plan.find(t => t.type === 'ELIGIBILITY_REMEDIATION');
      expect(task).toBeDefined();
      expect(task?.justification).toContain('2 active backlogs');
      expect(task?.horizon).toBe(90); // Long term resolution
    });

    it('4. should generate Skill Learning task for missing REQUIRED skill', () => {
      const input = createMockInput({
        skills: [{ name: 'React', proficiency: 0, required: true }]
      });
      const plan = generatePreparationPlan(input);
      
      const task = plan.find(t => t.type === 'SKILL_LEARNING');
      expect(task).toBeDefined();
      expect(task?.title).toBe('Learn React');
      expect(task?.priority).toBe('HIGH');
    });

    it('5. should generate Skill Practice task for weak skill', () => {
      const input = createMockInput({
        skills: [{ name: 'Java', proficiency: 40, required: true }]
      });
      const plan = generatePreparationPlan(input);
      
      const task = plan.find(t => t.type === 'SKILL_PRACTICE');
      expect(task).toBeDefined();
      expect(task?.title).toBe('Practice Java');
      expect(task?.priority).toBe('MEDIUM');
    });

    it('6. should generate Project Improvement if projects < 2', () => {
      const input = createMockInput({
        projects: [{ id: 'p1', name: 'Calc' }]
      });
      const plan = generatePreparationPlan(input);
      
      const task = plan.find(t => t.type === 'PROJECT_IMPROVEMENT');
      expect(task).toBeDefined();
      expect(task?.horizon).toBe(90);
    });

    it('7. should generate Assessment Practice if assessment < 60', () => {
      const input = createMockInput({
        assessments: { 'TECHNICAL': 45 }
      });
      const plan = generatePreparationPlan(input);
      
      const task = plan.find(t => t.type === 'ASSESSMENT_PRACTICE');
      expect(task).toBeDefined();
      expect(task?.title).toBe('Improve TECHNICAL Score');
    });
  });

  describe('Adaptive Horizon & Capacity Logic', () => {
    it('8. should push tasks to 30 days if 7-day capacity is exceeded', () => {
      // 1 hour a week = 60 mins capacity for 7 days
      const input = createMockInput({
        availabilityHoursPerWeek: 1,
        resume: { hasResume: false }, // 15 mins (fits)
        skills: [] // clear skills
      });
      
      // Let's manually push a second 7-day task that exceeds 60 min.
      // Profile Completion is 15. If we had 4 of them it would be 60.
      // A Resume Improvement is 60.
      input.resume = { hasResume: true, score: 50 }; // Resume Improvement (60m)
      
      const plan = generatePreparationPlan(input);
      const resumeTask = plan.find(t => t.type === 'RESUME_IMPROVEMENT');
      
      // It starts at 7 days, but 60 > capacity7 (60) because wait, 60 is NOT > 60. 
      // Actually, if we just make capacity 0.5 hrs = 30m.
      
      // Let's use 0.5 hours per week (30 mins).
      input.availabilityHoursPerWeek = 0.5;
      
      const plan2 = generatePreparationPlan(input);
      const resumeTask2 = plan2.find(t => t.type === 'RESUME_IMPROVEMENT');
      
      expect(resumeTask2?.horizon).toBe(30); // 60m > 30m capacity, pushed to 30
    });

    it('9. should push tasks to 90 days if 30-day capacity is exceeded', () => {
      // 1 hour a week = 240 mins capacity for 30 days
      const input = createMockInput({
        availabilityHoursPerWeek: 1,
        skills: [
          { name: 'S1', proficiency: 0, required: true }, // 300 mins (exceeds 30-day capacity 240m)
        ]
      });
      
      const plan = generatePreparationPlan(input);
      const skillTask = plan.find(t => t.type === 'SKILL_LEARNING');
      
      // The default horizon for SKILL_LEARNING is 30, but capacity pushes it to 90
      expect(skillTask?.horizon).toBe(90);
    });
  });

  describe('Idempotency & Progress Carryover', () => {
    it('10. should maintain IDs and Status of existing incomplete tasks', () => {
      const existingTask: PreparationTaskDef = {
        id: 'mock-id-123',
        title: 'Learn Node.js',
        type: 'SKILL_LEARNING',
        priority: 'HIGH',
        horizon: 30,
        status: 'IN_PROGRESS',
        estimatedMinutes: 300,
        dependencies: []
      };

      const input = createMockInput({
        skills: [{ name: 'Node.js', proficiency: 0, required: true }],
        existingTasks: [existingTask]
      });

      const plan = generatePreparationPlan(input);
      const task = plan.find(t => t.title === 'Learn Node.js');

      expect(task?.id).toBe('mock-id-123'); // ID preserved
      expect(task?.status).toBe('IN_PROGRESS'); // Status preserved
    });

    it('11. should preserve COMPLETED tasks even if gap technically exists', () => {
      const existingTask: PreparationTaskDef = {
        id: 'mock-id-456',
        title: 'Learn React',
        type: 'SKILL_LEARNING',
        priority: 'HIGH',
        horizon: 30,
        status: 'COMPLETED',
        estimatedMinutes: 300,
        dependencies: []
      };

      const input = createMockInput({
        skills: [{ name: 'React', proficiency: 0, required: true }],
        existingTasks: [existingTask]
      });

      const plan = generatePreparationPlan(input);
      const task = plan.find(t => t.title === 'Learn React');

      expect(task?.status).toBe('COMPLETED');
    });
  });
});
