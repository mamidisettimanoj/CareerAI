"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Briefcase, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SkillIntelligenceResult } from '@/domain/skills/types/skill.types';
import { ROLE_CATALOG, getRoleDefinition } from '@/domain/career-intelligence/config/roleCatalog';
import { Button } from '@/components/ui/button';
import { saveSkillsAction } from '@/actions/skills';

interface SkillsClientProps {
  initialTargetRole: string | null;
  intelligenceResult: SkillIntelligenceResult;
}

export function SkillsClient({ initialTargetRole, intelligenceResult }: SkillsClientProps) {
  const [selectedRole, setSelectedRole] = useState<string>('software-engineer');
  const [saving, setSaving] = useState(false);
  
  const [userSkills, setUserSkills] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialTargetRole) {
      const role = getRoleDefinition(initialTargetRole);
      if (role) {
        setSelectedRole(role.id);
      }
    }
  }, [initialTargetRole]);

  useEffect(() => {
    const initSkills: Record<string, number> = {};
    intelligenceResult.skills.forEach(s => {
      initSkills[s.normalizedName] = s.proficiencyScore;
    });
    setUserSkills(initSkills);
  }, [intelligenceResult]);

  const toggleSkill = (skill: string) => {
    setUserSkills(prev => {
      const current = prev[skill] || 0;
      let next = 0;
      if (current === 0) next = 25; // Beginner
      else if (current === 25) next = 50; // Intermediate
      else if (current === 50) next = 75; // Advanced
      else if (current === 75) next = 100; // Expert
      else next = 0; // Reset
      return { ...prev, [skill]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const skillsToSave = Object.entries(userSkills)
      .filter(([_, prof]) => prof > 0)
      .map(([name, prof]) => ({
        name,
        proficiency: prof,
        category: 'Other' // Simple fallback, in a full UI we'd have a form
      }));
      
    try {
      await saveSkillsAction(skillsToSave);
      // alert("Saved successfully!");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const currentProfile = getRoleDefinition(selectedRole) || ROLE_CATALOG[0];
  
  // Calculate gap
  const totalRequired = currentProfile.requiredSkills.length;
  let earnedRequired = 0;
  
  currentProfile.requiredSkills.forEach(req => {
    const userProf = userSkills[req.skillName] || 0;
    if (userProf >= req.minProficiency) {
      earnedRequired += 1;
    } else if (userProf > 0) {
      earnedRequired += 0.5;
    }
  });

  const readinessPercentage = totalRequired > 0 ? Math.round((earnedRequired / totalRequired) * 100) : 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Skill Gap Analyzer</h1>
          <p className="text-muted-foreground">Compare your skills against industry requirements.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Target Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_CATALOG.map(role => (
                <SelectItem key={role.id} value={role.id}>{role.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Skills"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Role Readiness</CardTitle>
            <CardDescription>{currentProfile.displayName}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-8 border-muted mb-4">
              <div 
                className={`absolute inset-0 rounded-full border-8 ${readinessPercentage >= 80 ? 'border-success' : readinessPercentage >= 50 ? 'border-gold' : 'border-destructive'}`}
                style={{ clipPath: `polygon(0 0, 100% 0, 100% ${readinessPercentage}%, 0 ${readinessPercentage}%)`, transform: 'rotate(-90deg)' }}
              />
              <span className="text-3xl font-bold">{readinessPercentage}%</span>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {readinessPercentage >= 80 ? 'You have a strong foundation for this role.' : 
               readinessPercentage >= 50 ? 'You need to strengthen some core skills.' : 
               'Significant skill gap detected. Start focusing on required skills.'}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Required Skills
            </CardTitle>
            <CardDescription>Click a skill to toggle your proficiency level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              {currentProfile.requiredSkills.map((req) => {
                const skill = req.skillName;
                const level = userSkills[skill] || 0;
                return (
                  <div 
                    key={skill} 
                    onClick={() => toggleSkill(skill)}
                    className="flex flex-col space-y-1 cursor-pointer p-2 hover:bg-card/80 rounded transition-colors"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{skill} <span className="text-xs text-muted-foreground ml-1">(Min: {req.minProficiency})</span></span>
                      <span className={`text-xs font-semibold ${level >= req.minProficiency ? 'text-success' : level > 0 ? 'text-gold' : 'text-muted-foreground'}`}>
                        {level >= 80 ? 'Expert' : level >= 60 ? 'Advanced' : level >= 40 ? 'Intermediate' : level > 0 ? 'Beginner' : 'Not Started'}
                      </span>
                    </div>
                    <Progress value={level} className="h-1.5" />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border/50">
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Preferred (Good to have)
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentProfile.preferredSkills.map(req => {
                   const skill = req.skillName;
                   const level = userSkills[skill] || 0;
                   return (
                   <div 
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-xs border cursor-pointer transition-colors ${
                      level > 0 
                        ? 'bg-accent/20 border-accent/30 text-accent' 
                        : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted'
                    }`}
                   >
                     {skill} {level > 0 && <CheckCircle2 className="inline h-3 w-3 ml-1" />}
                   </div>
                )})}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
