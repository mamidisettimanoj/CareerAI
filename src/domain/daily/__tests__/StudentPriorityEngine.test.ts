import { describe, it, expect } from 'vitest';
import { generateStudentPriorities } from '../StudentPriorityEngine';
import { Goal } from '@/domain/goals/types/goal.types';
import { DailyTask } from '@/domain/daily/types/daily.types';

describe('StudentPriorityEngine', () => {
  const baseConfig = {
    profileCompleteness: 100,
    activeBacklogs: 0,
    attendanceDangerCount: 0,
    goals: [] as Goal[],
    tasks: [] as DailyTask[],
    interviews: [] as any[],
    certifications: [] as any[]
  };

  it('ranks backlogs and attendance as HIGH priority', () => {
    const priorities = generateStudentPriorities({
      ...baseConfig,
      activeBacklogs: 2,
      attendanceDangerCount: 1
    });

    expect(priorities.length).toBe(2);
    expect(priorities[0].id).toBe('warn-backlog');
    expect(priorities[0].priority).toBe('HIGH');
    expect(priorities[1].id).toBe('warn-attendance');
    expect(priorities[1].priority).toBe('HIGH');
  });

  it('ranks profile completeness as MEDIUM priority if < 100', () => {
    const priorities = generateStudentPriorities({
      ...baseConfig,
      profileCompleteness: 80
    });

    expect(priorities.length).toBe(1);
    expect(priorities[0].id).toBe('warn-profile');
    expect(priorities[0].priority).toBe('MEDIUM');
  });

  it('prioritizes overdue goals correctly', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2); // 2 days ago

    const priorities = generateStudentPriorities({
      ...baseConfig,
      goals: [{
        id: '1', title: 'g1', category: 'Academic', priority: 'Medium', status: 'In Progress',
        deadline: pastDate.toISOString(), isAutomatic: false, createdAt: '', updatedAt: ''
      }]
    });

    expect(priorities[0].type).toBe('DEADLINE');
    expect(priorities[0].priority).toBe('HIGH');
    expect(priorities[0].title).toContain('Overdue Goal');
  });

  it('limits to top 5 items and sorts properly', () => {
    const priorities = generateStudentPriorities({
      ...baseConfig,
      profileCompleteness: 50, // 1 medium
      activeBacklogs: 1, // 1 high
      attendanceDangerCount: 2, // 1 high
      tasks: [
        { id: '1', title: 't1', category: 'Study', priority: 'High', completed: false, dueDate: new Date().toISOString().split('T')[0], createdAt: '' }, // 1 high
        { id: '2', title: 't2', category: 'Study', priority: 'Medium', completed: false, dueDate: new Date().toISOString().split('T')[0], createdAt: '' }, // 1 medium
        { id: '3', title: 't3', category: 'Study', priority: 'Low', completed: false, dueDate: new Date().toISOString().split('T')[0], createdAt: '' }, // 1 low
      ]
    });

    expect(priorities.length).toBe(5);
    // Highest should be first
    expect(priorities[0].priority).toBe('HIGH');
    expect(priorities[1].priority).toBe('HIGH');
    expect(priorities[2].priority).toBe('HIGH');
    expect(priorities[3].priority).toBe('MEDIUM');
    expect(priorities[4].priority).toBe('MEDIUM');
  });
});
