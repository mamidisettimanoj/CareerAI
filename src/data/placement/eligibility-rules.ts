export interface EligibilityRule {
  id: string;
  companyId: string;
  minCgpa: number;
  maxActiveBacklogs: number;
  maxHistoricalBacklogs: number;
  minSscPercentage: number;
  minHscPercentage: number;
  allowedBranches: string[]; // e.g. ['CSE', 'IT', 'ECE'] or ['ALL']
}

export const ELIGIBILITY_RULES: EligibilityRule[] = [
  {
    id: 'rule-tcs-ninja',
    companyId: 'tcs',
    minCgpa: 6.0,
    maxActiveBacklogs: 1,
    maxHistoricalBacklogs: 99, // They usually allow historical if cleared
    minSscPercentage: 60,
    minHscPercentage: 60,
    allowedBranches: ['ALL']
  },
  {
    id: 'rule-tcs-digital',
    companyId: 'tcs',
    minCgpa: 7.0,
    maxActiveBacklogs: 0,
    maxHistoricalBacklogs: 99,
    minSscPercentage: 70,
    minHscPercentage: 70,
    allowedBranches: ['CSE', 'IT', 'ECE']
  },
  {
    id: 'rule-infosys',
    companyId: 'infosys',
    minCgpa: 6.5,
    maxActiveBacklogs: 0,
    maxHistoricalBacklogs: 99,
    minSscPercentage: 60,
    minHscPercentage: 60,
    allowedBranches: ['ALL']
  },
  {
    id: 'rule-amazon',
    companyId: 'amazon',
    minCgpa: 7.5,
    maxActiveBacklogs: 0,
    maxHistoricalBacklogs: 0, // Strict
    minSscPercentage: 70,
    minHscPercentage: 70,
    allowedBranches: ['CSE', 'IT']
  },
  {
    id: 'rule-google',
    companyId: 'google',
    minCgpa: 8.0,
    maxActiveBacklogs: 0,
    maxHistoricalBacklogs: 0,
    minSscPercentage: 75,
    minHscPercentage: 75,
    allowedBranches: ['CSE', 'IT', 'Mathematics']
  }
];
