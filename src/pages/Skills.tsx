import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadData } from '@/lib/storage';
import { AppState } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Briefcase, AlertTriangle, CheckCircle2 } from 'lucide-react';

const roleProfiles: Record<string, { required: string[], recommended: string[] }> = {
  'Software Developer': {
    required: ['Data Structures & Algorithms', 'Object Oriented Programming', 'Database Management', 'Computer Networks', 'Operating Systems'],
    recommended: ['Version Control (Git)', 'Web Development', 'Cloud Basics']
  },
  'Data Analyst': {
    required: ['SQL', 'Python / R', 'Statistics', 'Data Visualization (Tableau/PowerBI)'],
    recommended: ['Machine Learning Basics', 'Excel Advanced', 'Big Data Concepts']
  },
  'Frontend Developer': {
    required: ['HTML/CSS', 'JavaScript/TypeScript', 'React / Angular / Vue', 'Responsive Design'],
    recommended: ['State Management', 'Web Performance', 'UI/UX Principles']
  },
  'Backend Developer': {
    required: ['Node.js / Java / Python', 'RESTful APIs', 'Database Design', 'System Architecture'],
    recommended: ['Docker/Containers', 'Caching (Redis)', 'Message Queues']
  }
};

export function Skills() {
  const [data, setData] = useState<AppState | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('Software Developer');
  
  // Simulated skill level marking for demo purposes
  const [userSkills, setUserSkills] = useState<Record<string, number>>({
    'Data Structures & Algorithms': 60,
    'Object Oriented Programming': 80,
    'Database Management': 50,
  });

  useEffect(() => {
    const loadedData = loadData();
    setData(loadedData);
    if (loadedData?.profile?.targetRole && roleProfiles[loadedData.profile.targetRole]) {
      setSelectedRole(loadedData.profile.targetRole);
    }
  }, []);

  const toggleSkill = (skill: string) => {
    setUserSkills(prev => {
      const current = prev[skill] || 0;
      let next = 0;
      if (current === 0) next = 50; // Beginner
      else if (current === 50) next = 80; // Intermediate
      else if (current === 80) next = 100; // Advanced
      else next = 0; // Reset
      return { ...prev, [skill]: next };
    });
  };

  const currentProfile = roleProfiles[selectedRole];
  
  // Calculate gap
  const totalRequired = currentProfile.required.length;
  const masteredRequired = currentProfile.required.filter(s => (userSkills[s] || 0) >= 80).length;
  const partialRequired = currentProfile.required.filter(s => (userSkills[s] || 0) === 50).length;
  
  const readinessPercentage = Math.round(((masteredRequired + (partialRequired * 0.5)) / totalRequired) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Skill Gap Analyzer</h1>
          <p className="text-muted-foreground">Compare your skills against industry requirements.</p>
        </div>
        
        <div className="w-full md:w-64">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select Target Role" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(roleProfiles).map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="glass-panel md:col-span-1">
          <CardHeader>
            <CardTitle>Role Readiness</CardTitle>
            <CardDescription>{selectedRole}</CardDescription>
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

        <Card className="glass-panel md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Required Skills
            </CardTitle>
            <CardDescription>Click a skill to toggle your proficiency level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              {currentProfile.required.map((skill) => {
                const level = userSkills[skill] || 0;
                return (
                  <div 
                    key={skill} 
                    onClick={() => toggleSkill(skill)}
                    className="flex flex-col space-y-1 cursor-pointer p-2 hover:bg-card/80 rounded transition-colors"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{skill}</span>
                      <span className={`text-xs font-semibold ${level === 100 ? 'text-success' : level === 80 ? 'text-primary' : level === 50 ? 'text-gold' : 'text-muted-foreground'}`}>
                        {level === 100 ? 'Advanced' : level === 80 ? 'Intermediate' : level === 50 ? 'Beginner' : 'Not Started'}
                      </span>
                    </div>
                    <Progress value={level} className="h-1.5" />
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border/50">
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Recommended (Good to have)
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentProfile.recommended.map(skill => (
                   <div 
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-xs border cursor-pointer transition-colors ${
                      (userSkills[skill] || 0) > 0 
                        ? 'bg-accent/20 border-accent/30 text-accent' 
                        : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted'
                    }`}
                   >
                     {skill} {((userSkills[skill] || 0) > 0) && <CheckCircle2 className="inline h-3 w-3 ml-1" />}
                   </div>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
