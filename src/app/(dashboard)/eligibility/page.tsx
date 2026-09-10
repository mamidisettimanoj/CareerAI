"use client";

import { useState, useEffect } from 'react';
import { EligibilityClient } from '@/components/eligibility/EligibilityClient';
import { CareerIntelligenceInput } from '@/domain/career-intelligence/types/intelligence.types';
import { analyzeAcademicRecord } from '@/domain/academic/engine/AcademicIntelligenceEngine';
import { repositories } from '@/services/ServiceLocator';
import { UserProfile, ProjectData } from '@/types';

export default function Eligibility() {
  const [input, setInput] = useState<CareerIntelligenceInput | null>(null);
  const [noProfile, setNoProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const profile = await repositories.profile.getProfile();
      
      if (!profile) {
        setNoProfile(true);
        setLoading(false);
        return;
      }
      
      const projects = await repositories.project.getProjects();
      
      const intelligenceInput: CareerIntelligenceInput = {
        academics: {
          cgpa: profile.degree.cgpa,
          sscPercentage: profile.personal.sscPercentage,
          hscPercentage: profile.hsc.percentage,
          activeBacklogs: profile.degree.backlogs,
          intelligence: analyzeAcademicRecord({
            cgpa: profile.degree.cgpa,
            percentage: profile.degree.percentage,
            activeBacklogs: profile.degree.backlogs,
            historicalBacklogs: 0,
            semesters: []
          })
        },
        skills: [],
        projects: projects.map(proj => ({
          id: proj.id,
          name: proj.title || proj.name || 'Untitled',
          description: proj.description,
          technologies: proj.technologies && proj.technologies.length > 0 ? proj.technologies : (proj.technology ? proj.technology.split(',').map(s => s.trim()) : []),
          githubUrl: proj.githubUrl,
          liveUrl: proj.demoUrl || proj.liveUrl
        })),
        resume: { hasResume: false },
        experience: {
          internshipsCount: profile.degree.internships,
          workExperienceMonths: profile.degree.workExperience * 12
        },
        assessments: {
          aptitudeScore: profile.skills.employabilityScore,
          technicalScore: profile.skills.technicalScore,
          communicationScore: profile.skills.communicationScore
        },
        targetRoleId: profile.targetRole
      };

      setInput(intelligenceInput);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">Loading...</div>;
  }

  if (noProfile || !input) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Profile Required</h2>
        <p className="text-muted-foreground">Please complete your profile in the Predict section first.</p>
      </div>
    );
  }

  return <EligibilityClient input={input} />;
}
