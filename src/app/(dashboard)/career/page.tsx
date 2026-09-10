"use client";

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { careerService } from '@/services/CareerService';
import { IntelligenceResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Target, Briefcase, GraduationCap, Code2, PenTool, CheckCircle2 } from 'lucide-react';
import { goalService } from '@/services/GoalService';
import { v4 as uuidv4 } from 'uuid';

export default function CareerReadinessPage() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const [analysis, setAnalysis] = useState<IntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalysis() {
      if (profile) {
        try {
          const result = await careerService.generateAnalysis();
          setAnalysis(result);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [profile]);

  const handleAddGoal = async (skillName: string) => {
    await goalService.saveGoal({
      id: uuidv4(),
      title: `Improve ${skillName}`,
      category: 'Skills',
      status: 'Not Started',
      priority: 'Medium',
      isAutomatic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    alert(`Goal added: Improve ${skillName}`);
  };

  if (loading) return <div className="p-8">Analyzing career profile...</div>;
  if (!profile) return <div className="p-8">Please complete your profile first.</div>;
  if (!analysis) return <div className="p-8 text-destructive">Failed to generate career intelligence.</div>;

  const { readiness, roleMatch } = analysis;

  const DimensionScoreCard = ({ title, scoreObj, icon: Icon }: any) => (
    <Card className={`border-l-4 ${scoreObj.dataCompleteness === 'MISSING' ? 'border-l-muted' : scoreObj.score >= 80 ? 'border-l-success' : scoreObj.score < 50 ? 'border-l-destructive' : 'border-l-gold'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center text-muted-foreground">
          <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {title}</span>
          <span className="font-bold text-foreground">
            {scoreObj.dataCompleteness === 'MISSING' ? 'Pending' : `${scoreObj.score}%`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scoreObj.dataCompleteness !== 'MISSING' && (
          <Progress value={scoreObj.score} className="h-1.5 mb-2" />
        )}
        <p className="text-xs text-muted-foreground">{scoreObj.explanation}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" /> Career Readiness Center
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Target Role: <span className="font-semibold text-foreground">{profile.targetRole || 'Not Set'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Overall Readiness Score */}
        <Card className="md:col-span-1 bg-primary/5 border-primary/20 flex flex-col justify-center items-center py-6">
          <CardTitle className="text-lg text-muted-foreground mb-2">Overall Readiness</CardTitle>
          <div className="text-5xl font-bold text-primary mb-2">{readiness.overallScore}%</div>
          <p className="text-sm text-center px-4 text-muted-foreground">Based on your current academic and skill evidence.</p>
        </Card>

        {/* Dimensions */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <DimensionScoreCard title="Academic" scoreObj={readiness.dimensions.academic} icon={GraduationCap} />
          <DimensionScoreCard title="Technical Skills" scoreObj={readiness.dimensions.technical} icon={Code2} />
          <DimensionScoreCard title="Projects" scoreObj={readiness.dimensions.project} icon={Briefcase} />
          <DimensionScoreCard title="Resume" scoreObj={readiness.dimensions.resume} icon={PenTool} />
          <DimensionScoreCard title="Aptitude" scoreObj={readiness.dimensions.aptitude} icon={BrainCircuit} />
          <DimensionScoreCard title="Interview" scoreObj={readiness.dimensions.interview} icon={CheckCircle2} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" /> Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readiness.priorityImprovements.length === 0 ? (
              <p className="text-muted-foreground">You are on a strong path. Keep building skills!</p>
            ) : (
              <ul className="space-y-4">
                {readiness.priorityImprovements.map((imp, idx) => (
                  <li key={idx} className="bg-muted/50 p-3 rounded-lg border-l-2 border-destructive">
                    <p className="font-semibold text-sm">{imp.area}</p>
                    <p className="text-sm text-muted-foreground">{imp.reason}</p>
                    <p className="text-sm font-medium mt-1 text-primary">Action: {imp.action}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Skill Gaps for Target Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Skill Gaps ({roleMatch?.roleName || 'Target Role'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!roleMatch ? (
              <p className="text-muted-foreground">Set a target role in your profile to see skill gaps.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Match Score</span>
                  <span className="text-sm font-bold text-success">{roleMatch.matchScore}%</span>
                </div>
                
                {roleMatch.skillGaps.missingSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-destructive">Missing Core Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {roleMatch.skillGaps.missingSkills.map(skill => (
                        <div key={skill} className="flex items-center gap-2 bg-destructive/10 text-destructive text-xs px-2 py-1 rounded border border-destructive/20">
                          {skill}
                          <button onClick={() => handleAddGoal(skill)} className="hover:text-primary underline text-[10px]">Add Goal</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {roleMatch.skillGaps.weakSkills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2 text-gold">Needs Improvement:</p>
                    <div className="flex flex-wrap gap-2">
                      {roleMatch.skillGaps.weakSkills.map(ws => (
                        <div key={ws.skill} className="flex items-center gap-2 bg-gold/10 text-gold-foreground text-xs px-2 py-1 rounded border border-gold/20">
                          {ws.skill} ({ws.current} → {ws.required})
                          <button onClick={() => handleAddGoal(ws.skill)} className="hover:text-primary underline text-[10px]">Add Goal</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {roleMatch.skillGaps.matchedSkills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2 text-success">Matched Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {roleMatch.skillGaps.matchedSkills.map(skill => (
                        <span key={skill} className="bg-success/10 text-success text-xs px-2 py-1 rounded border border-success/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Temporary icon component since lucid-react might not export BrainCircuit in older versions if not present, though it was in skills.
function BrainCircuit(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5Z"/><path d="M16 8V5c0-1.1.9-2 2-2"/><path d="M12 13h4"/><path d="M12 17h6"/><path d="M19 13v4"/><path d="M22 10v3"/><path d="M16 17v3"/></svg>;
}
