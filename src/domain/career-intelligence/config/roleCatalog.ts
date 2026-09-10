// src/domain/career-intelligence/config/roleCatalog.ts

export type RequirementImportance = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SkillRequirement {
  skillName: string;
  minProficiency: number;
  importance: RequirementImportance;
}

export interface RoleDefinition {
  id: string;
  displayName: string;
  requiredSkills: SkillRequirement[];
  preferredSkills: SkillRequirement[];
  minCgpa: number;
}

export const ROLE_CATALOG: RoleDefinition[] = [
  {
    id: "software-engineer",
    displayName: "Software Engineer",
    requiredSkills: [
      { skillName: "Data Structures & Algorithms", minProficiency: 50, importance: "HIGH" },
      { skillName: "JavaScript", minProficiency: 50, importance: "HIGH" },
      { skillName: "React", minProficiency: 40, importance: "MEDIUM" },
      { skillName: "SQL", minProficiency: 40, importance: "MEDIUM" }
    ],
    preferredSkills: [
      { skillName: "Node.js", minProficiency: 40, importance: "MEDIUM" },
      { skillName: "Docker", minProficiency: 25, importance: "LOW" },
      { skillName: "AWS", minProficiency: 25, importance: "LOW" },
      { skillName: "Git", minProficiency: 50, importance: "HIGH" }
    ],
    minCgpa: 7.0
  },
  {
    id: "data-analyst",
    displayName: "Data Analyst",
    requiredSkills: [
      { skillName: "SQL", minProficiency: 60, importance: "HIGH" },
      { skillName: "Python", minProficiency: 50, importance: "HIGH" },
      { skillName: "Statistics", minProficiency: 40, importance: "MEDIUM" }
    ],
    preferredSkills: [
      { skillName: "Tableau", minProficiency: 40, importance: "MEDIUM" },
      { skillName: "Machine Learning", minProficiency: 25, importance: "LOW" }
    ],
    minCgpa: 6.5
  },
  {
    id: "product-manager",
    displayName: "Product Manager",
    requiredSkills: [
      { skillName: "Communication", minProficiency: 70, importance: "HIGH" },
      { skillName: "Agile", minProficiency: 50, importance: "HIGH" }
    ],
    preferredSkills: [
      { skillName: "Data Analysis", minProficiency: 40, importance: "MEDIUM" },
      { skillName: "Figma", minProficiency: 40, importance: "LOW" }
    ],
    minCgpa: 7.0
  }
];

export function getRoleDefinition(roleId: string): RoleDefinition | undefined {
  return ROLE_CATALOG.find(r => r.id === roleId || r.displayName.toLowerCase() === roleId.toLowerCase());
}

