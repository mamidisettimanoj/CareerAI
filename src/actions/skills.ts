'use server'

import { requireUser } from '@/lib/auth'
import { serverRepositories } from '@/services/ServerServiceLocator'
import { normalizeSkillName } from '@/domain/skills/engine/SkillNormalizer'
import { revalidatePath } from 'next/cache'

export interface SaveSkillInput {
  name: string;
  proficiency: number;
  category: string;
}

export async function saveSkillsAction(skills: SaveSkillInput[]) {
  const user = await requireUser()
  
  // 1. Validation & Normalization
  const validSkills = [];
  const seenNames = new Set<string>();

  for (const skill of skills) {
    if (!skill.name) continue;
    
    const normalized = normalizeSkillName(skill.name);
    if (!normalized) continue;
    
    // Prevent duplicate alias-equivalent skills
    const key = normalized.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);

    const proficiency = Math.max(0, Math.min(100, skill.proficiency));
    
    validSkills.push({
      name: normalized,
      proficiency,
      category: skill.category || 'Other'
    });
  }

  // 2. Persistence
  await serverRepositories.skills.saveSkills(validSkills);
  
  revalidatePath('/skills')
  revalidatePath('/dashboard')
  
  return { success: true }
}
