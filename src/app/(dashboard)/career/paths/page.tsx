"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ROLE_CATALOG } from '@/domain/career-intelligence/config/roleCatalog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { profile } from 'console';

export default function CareerPathsPage() {
  const router = useRouter();
  const currentProfile = useLiveQuery(() => db.profile.get('me'));
  const skills = useLiveQuery(() => db.skills.toArray()) || [];
  
  const handleSetTarget = async (roleId: string, roleName: string) => {
    if (currentProfile) {
      currentProfile.targetRole = roleName; // Keep string or ID depending on how Profile stored it
      await db.profile.put(currentProfile);
      alert(`Target role updated to ${roleName}`);
      router.push('/career');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
          <Map className="h-6 w-6 text-primary" /> Career Paths
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Explore different roles, their required skills, and set your career target.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ROLE_CATALOG.map((role) => {
          const isTarget = currentProfile?.targetRole === role.displayName || currentProfile?.targetRole === role.id;
          
          return (
            <Card key={role.id} className={`flex flex-col justify-between ${isTarget ? 'border-primary shadow-sm' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <CardTitle>{role.displayName}</CardTitle>
                  </div>
                  {isTarget && (
                    <Badge variant="default" className="bg-primary flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Target
                    </Badge>
                  )}
                </div>
                <CardDescription>Minimum CGPA: {role.minCgpa}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.requiredSkills.map(req => {
                      const hasSkill = skills.some(s => s.name.toLowerCase() === req.skillName.toLowerCase() && s.proficiencyScore >= req.minProficiency);
                      return (
                        <Badge key={req.skillName} variant={hasSkill ? "default" : "secondary"} className={hasSkill ? 'bg-success hover:bg-success' : ''}>
                          {req.skillName} ({req.minProficiency}+)
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {role.preferredSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Preferred Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {role.preferredSkills.map(pref => {
                        const hasSkill = skills.some(s => s.name.toLowerCase() === pref.skillName.toLowerCase() && s.proficiencyScore >= pref.minProficiency);
                        return (
                          <Badge key={pref.skillName} variant="outline" className={hasSkill ? 'bg-success/10 border-success/30 text-success' : ''}>
                            {pref.skillName} ({pref.minProficiency}+)
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="pt-4">
                  <Button 
                    variant={isTarget ? "outline" : "default"} 
                    className="w-full" 
                    disabled={isTarget}
                    onClick={() => handleSetTarget(role.id, role.displayName)}
                  >
                    {isTarget ? 'Current Target' : 'Set as Target Role'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
