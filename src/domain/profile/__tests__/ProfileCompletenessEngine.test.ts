import { describe, it, expect } from 'vitest';
import { calculateProfileCompleteness } from '../ProfileCompletenessEngine';
import { UserProfile } from '@/types';

describe('ProfileCompletenessEngine', () => {
  it('returns 0% for null profile', () => {
    const result = calculateProfileCompleteness(null);
    expect(result.percentage).toBe(0);
    expect(result.missingFields.length).toBe(10);
  });

  it('calculates 100% for fully complete profile', () => {
    const fullProfile = {
      personal: { name: 'John Doe', email: 'j@d.com', phone: '123' },
      degree: { college: 'MIT', branch: 'CS', graduationYear: 2026 },
      targetRole: 'SDE',
      careerPreferences: { targetIndustry: 'Tech' },
      links: { linkedin: 'https://...', github: 'https://...' }
    } as any;
    
    const result = calculateProfileCompleteness(fullProfile);
    expect(result.percentage).toBe(100);
    expect(result.missingFields.length).toBe(0);
  });

  it('identifies missing fields correctly', () => {
    const partialProfile = {
      personal: { name: 'John Doe', email: 'j@d.com', phone: '' },
      degree: { college: 'MIT', branch: '', graduationYear: NaN },
      targetRole: '',
    } as any;
    
    const result = calculateProfileCompleteness(partialProfile);
    expect(result.percentage).toBe(30); // 3 out of 10 fields present (name, email)
    expect(result.missingFields).toContain('Phone Number');
    expect(result.missingFields).toContain('Branch/Major');
    expect(result.missingFields).toContain('Target Role');
  });
});
