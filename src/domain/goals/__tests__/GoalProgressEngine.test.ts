import { describe, it, expect } from 'vitest';
import { calculateGoalProgress } from '../GoalProgressEngine';
import { Goal } from '../types/goal.types';

describe('GoalProgressEngine', () => {
  it('calculates manual goal progress correctly', () => {
    const goal: Goal = {
      id: '1', title: 'test', category: 'Other', status: 'In Progress', priority: 'Low',
      isAutomatic: false, target: 10, currentValue: 4, createdAt: '', updatedAt: ''
    };
    
    const result = calculateGoalProgress({ goal });
    expect(result.percentage).toBe(40);
    expect(result.currentValue).toBe(4);
  });

  it('calculates automatic cgpa goal progress', () => {
    const goal: Goal = {
      id: '2', title: 'test', category: 'Academic', status: 'In Progress', priority: 'High',
      isAutomatic: true, metricId: 'cgpa', target: 8.0, createdAt: '', updatedAt: ''
    };
    
    const result = calculateGoalProgress({ goal, currentCgpa: 7.2 });
    expect(result.percentage).toBe(90); // 7.2 / 8.0 = 90%
    expect(result.currentValue).toBe(7.2);
  });

  it('calculates automatic active-backlogs progress correctly', () => {
    const goal: Goal = {
      id: '3', title: 'test', category: 'Backlog', status: 'In Progress', priority: 'High',
      isAutomatic: true, metricId: 'active-backlogs', target: 0, createdAt: '', updatedAt: ''
    };
    
    // 0 backlogs = 100%
    expect(calculateGoalProgress({ goal, activeBacklogs: 0 }).percentage).toBe(100);
    // 1 backlog = 85%
    expect(calculateGoalProgress({ goal, activeBacklogs: 1 }).percentage).toBe(85);
    // 7 backlogs = 0%
    expect(calculateGoalProgress({ goal, activeBacklogs: 7 }).percentage).toBe(0);
  });
});
