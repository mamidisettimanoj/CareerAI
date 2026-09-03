// src/domain/career-intelligence/engine/ReadinessEngine.ts

import { CareerIntelligenceInput, ReadinessScore, DimensionScore, ExplanationItem } from '../types/intelligence.types';
import { ENGINE_CONFIG } from '../config/engineConfig';
import { analyzeProjectPortfolio } from '../../projects/engine/ProjectIntelligenceEngine';

export function calculateReadiness(input: CareerIntelligenceInput): ReadinessScore {
  const { readinessWeights, penalties } = ENGINE_CONFIG;

  const priorityImprovements: ExplanationItem[] = [];
  const topStrengths: string[] = [];

  // --- ACADEMIC ---
  let academicScoreRaw = (input.academics.cgpa / 10) * 100;
  let academicCompleteness: 'COMPLETE' | 'PARTIAL' | 'MISSING' = 'COMPLETE';
  
  if (input.academics.intelligence) {
    const intel = input.academics.intelligence;
    academicCompleteness = intel.dataCompleteness;
    
    if (intel.dataCompleteness === 'MISSING') {
      academicScoreRaw = 0;
    } else {
      if (intel.backlogStatus === 'ACTIVE') {
        const penalty = Math.min(
          input.academics.activeBacklogs * penalties.backlogPenaltyPerUnit, 
          penalties.maxBacklogPenalty
        );
        academicScoreRaw = Math.max(0, academicScoreRaw - penalty);
        priorityImprovements.push({
          area: "Academic",
          reason: "Active backlogs significantly reduce placement chances.",
          action: "Clear all pending backlogs.",
          priority: "HIGH"
        });
      }
      
      if (input.academics.cgpa >= 8.0 && intel.backlogStatus !== 'ACTIVE') {
        topStrengths.push("Excellent Academic Record");
      } else if (input.academics.cgpa < 6.0) {
        priorityImprovements.push({
          area: "Academic",
          reason: "CGPA is below standard cutoff for many companies.",
          action: "Focus on core subjects to improve CGPA.",
          priority: "HIGH"
        });
      }
      
      if (intel.trend === 'DECLINING') {
        priorityImprovements.push({
          area: "Academic Trend",
          reason: "Your academic performance has been declining recently.",
          action: "Identify root causes and dedicate more time to studies.",
          priority: "MEDIUM"
        });
      }
    }
  } else {
    // Legacy fallback
    if (input.academics.cgpa === 0) {
      academicScoreRaw = 0;
      academicCompleteness = 'MISSING';
    } else {
      if (input.academics.activeBacklogs > 0) {
        const penalty = Math.min(
          input.academics.activeBacklogs * penalties.backlogPenaltyPerUnit, 
          penalties.maxBacklogPenalty
        );
        academicScoreRaw = Math.max(0, academicScoreRaw - penalty);
        priorityImprovements.push({
          area: "Academic",
          reason: "Active backlogs significantly reduce placement chances.",
          action: "Clear all pending backlogs.",
          priority: "HIGH"
        });
      } else if (input.academics.cgpa >= 8.0) {
        topStrengths.push("Excellent Academic Record");
      } else if (input.academics.cgpa < 6.0) {
        priorityImprovements.push({
          area: "Academic",
          reason: "CGPA is below standard cutoff for many companies.",
          action: "Focus on core subjects to improve CGPA.",
          priority: "HIGH"
        });
      }
    }
  }

  const academic: DimensionScore = {
    score: Math.round(academicScoreRaw),
    max: 100,
    contribution: (academicScoreRaw * readinessWeights.academic) / 100,
    explanation: academicCompleteness === 'MISSING' ? "Academic data missing" : `Based on CGPA ${input.academics.cgpa} and ${input.academics.activeBacklogs} backlogs.`,
    dataCompleteness: academicCompleteness
  };

  // --- TECHNICAL SKILLS ---
  let techCompleteness: 'COMPLETE' | 'PARTIAL' | 'MISSING' = 'COMPLETE';
  let techScoreRaw = input.assessments.technicalScore ?? 0;
  
  if (input.assessments.technicalScore === undefined && input.skills.length === 0) {
    techCompleteness = 'MISSING';
    priorityImprovements.push({
      area: "Technical Skills",
      reason: "No technical skills or assessments found.",
      action: "Add your technical skills to your profile.",
      priority: "HIGH"
    });
  } else if (input.assessments.technicalScore === undefined && input.skills.length > 0) {
    techCompleteness = 'PARTIAL';
    // Estimate based on number of skills if no explicit assessment
    techScoreRaw = Math.min(100, input.skills.length * 10);
  } else if (techScoreRaw >= 80) {
    topStrengths.push("Strong Technical Foundation");
  }

  const technical: DimensionScore = {
    score: Math.round(techScoreRaw),
    max: 100,
    contribution: (techScoreRaw * readinessWeights.technical) / 100,
    explanation: techCompleteness === 'MISSING' ? "No data" : techCompleteness === 'PARTIAL' ? "Estimated from added skills" : "Based on technical assessments",
    dataCompleteness: techCompleteness
  };

  // --- PROJECTS ---
  const projectIntel = analyzeProjectPortfolio(input.projects);
  
  let projectCompleteness: 'COMPLETE' | 'MISSING' = 'COMPLETE';
  let projectScoreRaw = projectIntel.overallQuality; // Uses the deterministic quality score (0-100)
  
  if (input.projects.length === 0) {
    projectCompleteness = 'MISSING';
    priorityImprovements.push({
      area: "Projects",
      reason: "Practical implementation proves technical skills better than grades.",
      action: "Build and add at least one full-stack or domain-specific project.",
      priority: "HIGH"
    });
  } else if (projectIntel.deployedProjects >= 1 && projectIntel.repositoryProjects >= 1) {
    topStrengths.push("Good Project Portfolio with Real Evidence");
  }

  const project: DimensionScore = {
    score: Math.round(projectScoreRaw),
    max: 100,
    contribution: (projectScoreRaw * readinessWeights.project) / 100,
    explanation: `${projectIntel.totalProjects} project(s) recorded, ${projectIntel.deployedProjects} deployed.`,
    dataCompleteness: projectCompleteness
  };

  // --- APTITUDE ---
  let aptitudeCompleteness: 'COMPLETE' | 'MISSING' = 'COMPLETE';
  let aptitudeScoreRaw = input.assessments.aptitudeScore ?? 0;

  if (input.assessments.aptitudeScore === undefined) {
    aptitudeCompleteness = 'MISSING';
  } else if (aptitudeScoreRaw >= 75) {
    topStrengths.push("Strong Aptitude & Logical Reasoning");
  } else if (aptitudeScoreRaw < 60) {
    priorityImprovements.push({
      area: "Aptitude",
      reason: "Aptitude tests are the first elimination round.",
      action: "Practice quantitative and logical reasoning problems.",
      priority: "MEDIUM"
    });
  }

  const aptitude: DimensionScore = {
    score: Math.round(aptitudeScoreRaw),
    max: 100,
    contribution: (aptitudeScoreRaw * readinessWeights.aptitude) / 100,
    explanation: aptitudeCompleteness === 'MISSING' ? "Aptitude score missing" : "Based on aptitude assessments",
    dataCompleteness: aptitudeCompleteness
  };

  // --- RESUME ---
  let resumeCompleteness: 'COMPLETE' | 'PARTIAL' | 'MINIMAL' | 'MISSING' = 'MISSING';
  let resumeScoreRaw = 0;

  if (!input.resume.hasResume) {
    resumeCompleteness = 'MISSING';
    priorityImprovements.push({
      area: "Resume",
      reason: "A resume is required for all placement applications.",
      action: "Upload your resume for analysis.",
      priority: "HIGH"
    });
  } else if (input.resume.intelligence) {
    const intel = input.resume.intelligence;
    resumeCompleteness = intel.completeness;
    resumeScoreRaw = intel.qualityScore;

    if (intel.completeness === 'MISSING' || intel.status === 'FAILED') {
      priorityImprovements.push({
        area: "Resume Parsing",
        reason: "We could not read your resume.",
        action: "Ensure your resume is a valid, text-searchable PDF.",
        priority: "HIGH"
      });
    } else if (resumeScoreRaw >= 80) {
      topStrengths.push("Excellent Resume Content");
    } else {
      intel.missingSections.slice(0, 2).forEach(sec => {
        priorityImprovements.push({
          area: "Resume Structure",
          reason: `Missing critical section: ${sec}`,
          action: `Add a dedicated ${sec} section to your resume.`,
          priority: "MEDIUM"
        });
      });
    }
  } else {
    // Legacy fallback
    if (input.resume.text) {
      const text = input.resume.text.toLowerCase();
      const hasEducation = text.includes('education') || text.includes('university') || text.includes('college');
      const hasExperience = text.includes('experience') || text.includes('internship');
      const hasProjects = text.includes('project');
      const hasSkills = text.includes('skill');
      
      let base = 0;
      if (hasEducation) base += 25;
      if (hasExperience) base += 25;
      if (hasProjects) base += 25;
      if (hasSkills) base += 25;
      resumeScoreRaw = base;
      resumeCompleteness = base >= 75 ? 'COMPLETE' : 'PARTIAL';
    } else {
      resumeScoreRaw = Math.min(100, (input.projects.length * 20) + (input.experience.internshipsCount * 30) + 20);
      resumeCompleteness = 'PARTIAL';
    }
  }

  const resume: DimensionScore = {
    score: Math.round(resumeScoreRaw),
    max: 100,
    contribution: (resumeScoreRaw * readinessWeights.resume) / 100,
    explanation: resumeCompleteness === 'MISSING' ? "No resume provided" : "Based on resume intelligence analysis",
    dataCompleteness: resumeCompleteness as any // Typescript mapped to 'COMPLETE' | 'PARTIAL' | 'MISSING'
  };

  // --- INTERVIEW / COMMUNICATION ---
  let interviewCompleteness: 'COMPLETE' | 'MISSING' = 'COMPLETE';
  let interviewScoreRaw = input.assessments.communicationScore ?? 0;

  if (input.assessments.communicationScore === undefined) {
    interviewCompleteness = 'MISSING';
  }

  const interview: DimensionScore = {
    score: Math.round(interviewScoreRaw),
    max: 100,
    contribution: (interviewScoreRaw * readinessWeights.interview) / 100,
    explanation: interviewCompleteness === 'MISSING' ? "No communication data" : "Based on communication assessments",
    dataCompleteness: interviewCompleteness
  };

  const overallScore = Math.round(
    academic.contribution + 
    technical.contribution + 
    project.contribution + 
    aptitude.contribution + 
    resume.contribution + 
    interview.contribution
  );

  return {
    overallScore,
    dimensions: {
      academic,
      technical,
      project,
      resume,
      aptitude,
      interview
    },
    topStrengths,
    priorityImprovements
  };
}
