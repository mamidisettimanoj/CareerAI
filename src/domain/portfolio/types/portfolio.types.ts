export interface InternshipData {
  id: string;
  company: string;
  role: string;
  type: 'Full-time' | 'Part-time' | 'Remote';
  location?: string;
  startDate: string;
  endDate?: string;
  duration?: string;
  stipend?: string;
  skills: string[]; // IDs mapping to candidate skills
  description: string;
  achievements: string[];
  certificateUrl?: string;
  status: 'Planned' | 'Applied' | 'Ongoing' | 'Completed' | 'Rejected';
  notes?: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementData {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'Hackathon' | 'Coding Contest' | 'Award' | 'Publication' | 'Leadership' | 'Volunteering' | 'Club' | 'Sports' | 'Academic' | 'Other';
  organization?: string;
  position?: string;
  evidenceUrl?: string;
  skills: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResumeSectionType = 'Personal' | 'Summary' | 'Education' | 'Skills' | 'Projects' | 'Internships' | 'Certifications' | 'Achievements' | 'Links';

export interface ResumeSectionDef {
  id: string;
  type: ResumeSectionType;
  isVisible: boolean;
  order: number;
  // For collections like Projects, we store which specific IDs are included
  includedItemIds?: string[]; 
}

export interface ResumeVersion {
  id: string;
  name: string; // e.g., 'Software Engineer Version'
  targetRole: string;
  sections: ResumeSectionDef[];
  createdAt: string;
  updatedAt: string;
}
