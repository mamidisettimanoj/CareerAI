import { v4 as uuidv4 } from 'uuid';
import { 
  PreparationPlanInput, 
  PreparationTaskDef, 
  TaskPriority, 
  PlanningHorizon 
} from '../types/preparation.types';
import { BASE_EFFORT_MINUTES, getTaskPriority } from '../config/priority.config';

export function generatePreparationPlan(input: PreparationPlanInput): PreparationTaskDef[] {
  const tasks: PreparationTaskDef[] = [];
  const existingMap = new Map<string, PreparationTaskDef>(
    input.existingTasks.map(t => [t.title, t]) // Map by title to carry over progress for identical tasks
  );

  const addTask = (title: string, taskParams: Omit<PreparationTaskDef, 'id' | 'title' | 'status'>) => {
    const existing = existingMap.get(title);
    if (existing && existing.status === 'COMPLETED') {
      // Retain completed tasks if they are still relevant, or they just stay completed in history.
      tasks.push(existing);
      return;
    }

    // Carry over IN_PROGRESS or create new
    tasks.push({
      id: existing ? existing.id : uuidv4(),
      title,
      status: existing ? existing.status : 'TODO',
      ...taskParams
    });
  };

  // 1. Profile & Resume Gaps (Immediate 7-day blockers)
  if (!input.resume.hasResume) {
    addTask('Upload Resume', {
      type: 'PROFILE_COMPLETION',
      priority: 'HIGH',
      horizon: 7,
      estimatedMinutes: BASE_EFFORT_MINUTES.PROFILE_COMPLETION,
      justification: 'Resume is missing, blocking readiness evaluation.',
      dependencies: []
    });
  } else if (input.resume.score !== undefined && input.resume.score < 70) {
    addTask('Improve Resume Quality', {
      type: 'RESUME_IMPROVEMENT',
      priority: 'HIGH',
      horizon: 7,
      estimatedMinutes: BASE_EFFORT_MINUTES.RESUME_IMPROVEMENT,
      justification: `Current resume score is ${input.resume.score}%. A score of 70%+ is recommended.`,
      dependencies: []
    });
  }

  // 2. Academic Gaps
  if (input.academics.activeBacklogs > 0) {
    addTask('Clear Active Backlogs', {
      type: 'ELIGIBILITY_REMEDIATION',
      priority: 'HIGH',
      horizon: 90, // Long term effort
      estimatedMinutes: BASE_EFFORT_MINUTES.ELIGIBILITY_REMEDIATION * input.academics.activeBacklogs,
      justification: `You have ${input.academics.activeBacklogs} active backlogs blocking standard eligibility.`,
      dependencies: []
    });
  }

  // 3. Skill Gaps
  for (const skill of input.skills) {
    if (skill.required && skill.proficiency === 0) {
      addTask(`Learn ${skill.name}`, {
        type: 'SKILL_LEARNING',
        priority: 'HIGH',
        horizon: 30,
        estimatedMinutes: BASE_EFFORT_MINUTES.SKILL_LEARNING,
        justification: `Required by target role ${input.targetRole || 'industry'}.`,
        dependencies: []
      });
    } else if (skill.proficiency < 60) {
      addTask(`Practice ${skill.name}`, {
        type: 'SKILL_PRACTICE',
        priority: skill.required ? 'MEDIUM' : 'LOW',
        horizon: 30,
        estimatedMinutes: BASE_EFFORT_MINUTES.SKILL_PRACTICE,
        justification: `Proficiency is currently ${skill.proficiency}%. Improve to 60%+ for strong readiness.`,
        dependencies: []
      });
    }
  }

  // 4. Project Gaps
  const targetProjectCount = 2;
  if (input.projects.length < targetProjectCount) {
    addTask('Build a New Portfolio Project', {
      type: 'PROJECT_IMPROVEMENT',
      priority: 'MEDIUM',
      horizon: 90,
      estimatedMinutes: BASE_EFFORT_MINUTES.PROJECT_IMPROVEMENT,
      justification: `You only have ${input.projects.length} projects. Aim for at least ${targetProjectCount}.`,
      dependencies: []
    });
  }

  // 5. Assessment Gaps
  for (const [category, score] of Object.entries(input.assessments)) {
    if (score < 60) {
      addTask(`Improve ${category} Score`, {
        type: 'ASSESSMENT_PRACTICE',
        priority: 'MEDIUM',
        horizon: 30,
        estimatedMinutes: BASE_EFFORT_MINUTES.ASSESSMENT_PRACTICE,
        justification: `${category} assessment score is ${score}%. Target >60%.`,
        dependencies: []
      });
    }
  }

  // Allocate Horizons based on available time constraint
  // We can push items from 7->30 or 30->90 if available capacity is exceeded.
  let allocatedMinutes7 = 0;
  let allocatedMinutes30 = 0;
  const capacity7 = (input.availabilityHoursPerWeek * 60);
  const capacity30 = (input.availabilityHoursPerWeek * 4 * 60);

  // Sort by Priority (HIGH -> MEDIUM -> LOW)
  const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  for (const task of tasks) {
    if (task.status === 'COMPLETED') continue;

    if (task.horizon === 7) {
      if (allocatedMinutes7 + task.estimatedMinutes > capacity7) {
        task.horizon = 30; // Push to 30
      } else {
        allocatedMinutes7 += task.estimatedMinutes;
      }
    }
    
    if (task.horizon === 30) {
      if (allocatedMinutes30 + task.estimatedMinutes > capacity30) {
        task.horizon = 90; // Push to 90
      } else {
        allocatedMinutes30 += task.estimatedMinutes;
      }
    }
  }

  return tasks;
}
