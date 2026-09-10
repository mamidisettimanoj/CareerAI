// src/domain/career-intelligence/config/engineConfig.ts

export const ENGINE_CONFIG = {
  version: "2.0",
  
  // Weights must sum to 100
  readinessWeights: {
    academic: 25,
    technical: 25,
    project: 15,
    aptitude: 15,
    resume: 10,
    interview: 10
  },

  // Scoring thresholds
  thresholds: {
    excellent: 80,
    good: 60,
    needsWork: 40
  },

  // Penalty configuration
  penalties: {
    // Penalty per active backlog
    backlogPenaltyPerUnit: 10,
    
    // Max penalty for backlogs regardless of count
    maxBacklogPenalty: 30,

    // Base score drop if missing critical sections like resume
    missingDataPenalty: 20
  }
};
