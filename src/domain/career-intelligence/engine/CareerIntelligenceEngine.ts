// src/domain/career-intelligence/engine/CareerIntelligenceEngine.ts

import { CareerIntelligenceInput, IntelligenceResult } from '../types/intelligence.types';
import { ENGINE_CONFIG } from '../config/engineConfig';
import { calculateReadiness } from './ReadinessEngine';
import { calculateRoleMatch } from './RoleMatchEngine';
import { calculateEligibility } from './EligibilityEngine';

/**
 * Core Career Intelligence Engine Orchestrator
 * A fully deterministic, pure domain function.
 */
export function analyzeCareerProfile(input: CareerIntelligenceInput): IntelligenceResult {
  const readiness = calculateReadiness(input);
  const roleMatch = calculateRoleMatch(input);
  const eligibility = calculateEligibility(input);

  const readinessScore = readiness.overallScore;
  let summary = `Your overall placement readiness is estimated at ${readinessScore}%. `;
  if (readinessScore >= 80) summary += "You have a highly competitive profile for campus placements. Keep refining your advanced skills.";
  else if (readinessScore >= 60) summary += "You are on the right track, but need targeted preparation in key areas before placement season begins.";
  else summary += "Your profile requires immediate attention. Focus on clearing backlogs, practicing aptitude, and building core technical skills.";

  const sevenDayPlan = generateSevenDayPlan(readiness.priorityImprovements);
  const thirtyDayRoadmap = generateThirtyDayRoadmap(readiness.priorityImprovements);

  return {
    version: ENGINE_CONFIG.version,
    timestamp: new Date().toISOString(),
    readiness,
    roleMatch,
    eligibility,
    summary,
    sevenDayPlan,
    thirtyDayRoadmap
  };
}

function generateSevenDayPlan(weaknesses: any[]) {
  const plan = [
    { day: 1, focus: "Profile Review", task: "Review your resume and identify missing keywords." },
    { day: 2, focus: "Aptitude Practice", task: "Solve 20 quantitative aptitude questions." },
    { day: 3, focus: "Technical Core", task: "Revise one core subject (DBMS/OS/CN)." },
    { day: 4, focus: "Coding Practice", task: "Solve 3 easy and 1 medium programming problem." },
    { day: 5, focus: "Communication", task: "Record yourself answering 3 common HR questions." },
    { day: 6, focus: "Project Work", task: "Spend 2 hours improving your best project." },
    { day: 7, focus: "Mock Test", task: "Take a full-length mock placement test." },
  ];

  const hasAptitude = weaknesses.some(w => w.area === 'Aptitude');
  const hasTech = weaknesses.some(w => w.area === 'Technical Skills');
  const hasProjects = weaknesses.some(w => w.area === 'Projects');

  if (hasAptitude) {
    plan[1] = { day: 2, focus: "Critical Aptitude", task: "Your aptitude score is low. Solve 40 questions focusing on weak topics." };
    plan[6] = { day: 7, focus: "Aptitude Mock", task: "Take a strict 60-minute aptitude mock test." };
  }

  if (hasTech) {
    plan[2] = { day: 3, focus: "DSA Foundations", task: "Your technical score needs work. Practice Arrays and Strings." };
    plan[3] = { day: 4, focus: "DSA Practice", task: "Solve 5 foundational DSA questions." };
  }

  if (hasProjects) {
    plan[5] = { day: 6, focus: "Project Initialization", task: "Start planning a new project. Define the tech stack and goals." };
  }

  return plan;
}

function generateThirtyDayRoadmap(weaknesses: any[]) {
  return [
    {
      week: 1,
      theme: "Foundation & Academics",
      goals: ["Clear any pending assignments", "Revise core OS & DBMS concepts", "Start daily 30-min aptitude practice"]
    },
    {
      week: 2,
      theme: "Technical Deep Dive",
      goals: ["Complete basic Data Structures (Arrays, Lists, Stacks)", "Solve 20 programming problems", "Review OOP concepts"]
    },
    {
      week: 3,
      theme: "Projects & Portfolio",
      goals: ["Build or polish one significant project", "Update GitHub with proper READMEs", "Draft initial resume"]
    },
    {
      week: 4,
      theme: "Interview Readiness",
      goals: ["Participate in 2 mock interviews", "Prepare HR interview answers", "Apply to 5 off-campus opportunities"]
    }
  ];
}
