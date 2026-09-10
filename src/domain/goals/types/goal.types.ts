export type GoalCategory = 
  | 'Academic' 
  | 'Attendance' 
  | 'Backlog' 
  | 'Career' 
  | 'Skills' 
  | 'DSA' 
  | 'Aptitude' 
  | 'Projects' 
  | 'Resume' 
  | 'Applications' 
  | 'Interview' 
  | 'Placement' 
  | 'Other';

export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Overdue' | 'Paused';
export type GoalPriority = 'Low' | 'Medium' | 'High';

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  description?: string;
  target?: number;
  currentValue?: number;
  unit?: string;
  deadline?: string; // ISO Date String
  status: GoalStatus;
  priority: GoalPriority;
  isAutomatic: boolean;
  metricId?: string; // used for auto goals like 'cgpa', 'attendance'
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
