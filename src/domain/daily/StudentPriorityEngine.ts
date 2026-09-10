import { Goal } from '@/domain/goals/types/goal.types';
import { DailyTask } from '@/domain/daily/types/daily.types';
import { Application, InterviewRound } from '@/domain/placement/types/placement.types';
import { CertificationData } from '@/types';

export interface PriorityItem {
  id: string;
  title: string;
  type: 'WARNING' | 'DEADLINE' | 'GOAL' | 'TASK' | 'PROFILE' | 'INTERVIEW' | 'APPLICATION' | 'CERTIFICATION';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actionLabel?: string;
  actionHref?: string;
}

export interface PriorityConfig {
  profileCompleteness: number;
  activeBacklogs: number;
  attendanceDangerCount: number;
  goals: Goal[];
  tasks: DailyTask[];
  interviews: InterviewRound[];
  applications: Application[];
  certifications: CertificationData[];
}

export function generateStudentPriorities(config: PriorityConfig): PriorityItem[] {
  const items: PriorityItem[] = [];
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().getTime();

  // 0. Upcoming Interviews (CRITICAL)
  config.interviews.forEach(interview => {
    if (interview.status === 'SCHEDULED') {
      const interviewDate = new Date(interview.date).getTime();
      const diffDays = Math.ceil((interviewDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7) {
        items.push({
          id: `interview-${interview.id}`,
          title: `Interview in ${diffDays} days!`,
          type: 'INTERVIEW',
          priority: 'CRITICAL',
          actionLabel: 'Prepare Now',
          actionHref: '/preparation/interview'
        });
      }
    }
  });

  // 0. Expiring Certifications
  config.certifications.forEach(cert => {
    if (cert.status === 'Active' && cert.expiryDate) {
      const expiryDate = new Date(cert.expiryDate).getTime();
      const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        items.push({
          id: `cert-${cert.id}`,
          title: `Certification "${cert.name}" expires in ${diffDays} days.`,
          type: 'CERTIFICATION',
          priority: diffDays <= 7 ? 'HIGH' : 'MEDIUM',
          actionLabel: 'View Certifications',
          actionHref: '/certifications'
        });
      }
    }
  });

  // 1. Critical Academic Warnings (Always HIGH)
  if (config.activeBacklogs > 0) {
    items.push({
      id: 'warn-backlog',
      title: `You have ${config.activeBacklogs} active backlogs. Clearing these is your absolute highest priority.`,
      type: 'WARNING',
      priority: 'HIGH',
      actionLabel: 'View Backlogs',
      actionHref: '/academic/backlogs'
    });
  }

  if (config.attendanceDangerCount > 0) {
    items.push({
      id: 'warn-attendance',
      title: `${config.attendanceDangerCount} subjects are in danger of falling below target attendance.`,
      type: 'WARNING',
      priority: 'HIGH',
      actionLabel: 'Check Attendance',
      actionHref: '/academic/attendance'
    });
  }

  // 2. Overdue / Imminent Goals
  config.goals.forEach(goal => {
    if (goal.status === 'Completed' || goal.status === 'Paused') return;
    if (goal.deadline) {
      const deadlineDate = new Date(goal.deadline).getTime();
      const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        items.push({
          id: `goal-overdue-${goal.id}`,
          title: `Overdue Goal: ${goal.title}`,
          type: 'DEADLINE',
          priority: 'HIGH',
          actionLabel: 'Update Goal',
          actionHref: '/goals'
        });
      } else if (diffDays <= 3) {
        items.push({
          id: `goal-soon-${goal.id}`,
          title: `Goal Deadline Approaching: ${goal.title} (in ${diffDays} days)`,
          type: 'DEADLINE',
          priority: 'HIGH',
          actionLabel: 'View Goal',
          actionHref: '/goals'
        });
      }
    }
  });

  // 3. Today's Tasks
  config.tasks.forEach(task => {
    if (task.completed) return;
    const taskPriority = task.priority.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';
    if (task.dueDate === today) {
      items.push({
        id: `task-today-${task.id}`,
        title: `Task Due Today: ${task.title}`,
        type: 'TASK',
        priority: taskPriority,
      });
    } else if (task.dueDate < today) {
      items.push({
        id: `task-overdue-${task.id}`,
        title: `Overdue Task: ${task.title}`,
        type: 'TASK',
        priority: 'HIGH',
      });
    }
  });

  // 4. Profile Completeness (MEDIUM)
  if (config.profileCompleteness < 100) {
    items.push({
      id: 'warn-profile',
      title: `Your profile is only ${config.profileCompleteness}% complete. Finish it to unlock accurate placement predictions.`,
      type: 'PROFILE',
      priority: 'MEDIUM',
      actionLabel: 'Complete Profile',
      actionHref: '/profile'
    });
  }

  // 5. Active High Priority Goals (without imminent deadlines)
  config.goals.forEach(goal => {
    if (goal.status !== 'Completed' && goal.status !== 'Paused' && goal.priority === 'High' && !items.find(i => i.id === `goal-soon-${goal.id}` || i.id === `goal-overdue-${goal.id}`)) {
      items.push({
        id: `goal-high-${goal.id}`,
        title: `High Priority Goal: ${goal.title}`,
        type: 'GOAL',
        priority: 'MEDIUM',
        actionLabel: 'View Goal',
        actionHref: '/goals'
      });
    }
  });

  // Sort: CRITICAL > HIGH > MEDIUM > LOW
  items.sort((a, b) => {
    const pMap = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return pMap[b.priority] - pMap[a.priority];
  });

  return items.slice(0, 5); // Return top 5 priorities
}
