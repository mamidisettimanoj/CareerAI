import { describe, it, expect } from 'vitest';
import { calculateStreakUpdate } from '../StreakEngine';

describe('StreakEngine', () => {
  it('starts a new streak if none exists', () => {
    const today = new Date().toISOString();
    const streak = calculateStreakUpdate(null, today);
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(1);
    expect(streak.lastActivityDate).toBe(today);
  });

  it('does not increment streak if tracked again on the same day', () => {
    const today = new Date().toISOString();
    const existing = { id: 'global', currentStreak: 3, longestStreak: 3, lastActivityDate: today };
    const streak = calculateStreakUpdate(existing, today);
    expect(streak.currentStreak).toBe(3);
  });

  it('increments streak if tracked on consecutive day', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const today = new Date().toISOString();
    const existing = { id: 'global', currentStreak: 3, longestStreak: 3, lastActivityDate: yesterday.toISOString() };
    const streak = calculateStreakUpdate(existing, today);
    
    expect(streak.currentStreak).toBe(4);
    expect(streak.longestStreak).toBe(4);
  });

  it('breaks streak if difference is more than 1 day', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3); // 3 days ago
    
    const today = new Date().toISOString();
    const existing = { id: 'global', currentStreak: 5, longestStreak: 5, lastActivityDate: past.toISOString() };
    const streak = calculateStreakUpdate(existing, today);
    
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(5); // retains longest
  });
});
