import { ActivityStreak } from '@/domain/daily/types/daily.types';

export function calculateStreakUpdate(streak: ActivityStreak | null, activityDateISO: string): ActivityStreak {
  const defaultStreak: ActivityStreak = { id: 'global', currentStreak: 1, longestStreak: 1, lastActivityDate: activityDateISO };
  
  if (!streak || !streak.lastActivityDate) {
    return defaultStreak;
  }

  const activityDate = new Date(activityDateISO).toISOString().split('T')[0];
  const lastDate = new Date(streak.lastActivityDate).toISOString().split('T')[0];

  if (activityDate === lastDate) {
    // Already tracked today
    return streak;
  }

  const lastTime = new Date(lastDate).getTime();
  const activityTime = new Date(activityDate).getTime();
  const diffDays = Math.round((activityTime - lastTime) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    const newCurrent = streak.currentStreak + 1;
    return {
      ...streak,
      currentStreak: newCurrent,
      longestStreak: Math.max(streak.longestStreak, newCurrent),
      lastActivityDate: activityDateISO
    };
  } else if (diffDays > 1) {
    // Streak broken
    return {
      ...streak,
      currentStreak: 1,
      lastActivityDate: activityDateISO
    };
  }

  // Future date edge case
  return streak;
}
