import { UserProfile } from '@/types';

export interface CompletenessResult {
  percentage: number;
  missingFields: string[];
}

const REQUIRED_FIELDS = [
  { key: 'personal.name', label: 'Full Name' },
  { key: 'personal.email', label: 'Email Address' },
  { key: 'personal.phone', label: 'Phone Number' },
  { key: 'degree.college', label: 'College Name' },
  { key: 'degree.branch', label: 'Branch/Major' },
  { key: 'degree.graduationYear', label: 'Graduation Year' },
  { key: 'targetRole', label: 'Target Role' },
  { key: 'careerPreferences.targetIndustry', label: 'Target Industry' },
  { key: 'links.linkedin', label: 'LinkedIn Profile' },
  { key: 'links.github', label: 'GitHub/Portfolio' }
];

export function calculateProfileCompleteness(profile: UserProfile | null): CompletenessResult {
  if (!profile) {
    return { percentage: 0, missingFields: REQUIRED_FIELDS.map(f => f.label) };
  }

  const missingFields: string[] = [];

  REQUIRED_FIELDS.forEach(field => {
    const parts = field.key.split('.');
    let value: any = profile;
    for (const part of parts) {
      if (value === undefined || value === null) break;
      value = value[part];
    }
    
    if (!value || (typeof value === 'string' && value.trim() === '') || (typeof value === 'number' && isNaN(value))) {
      missingFields.push(field.label);
    }
  });

  const completedCount = REQUIRED_FIELDS.length - missingFields.length;
  const percentage = Math.round((completedCount / REQUIRED_FIELDS.length) * 100);

  return {
    percentage,
    missingFields
  };
}
