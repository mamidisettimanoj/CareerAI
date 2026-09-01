"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { loadData } from '@/lib/storage';
import { AppState } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { GraduationCap, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function Academic() {
  const [data, setData] = useState<AppState | null>(null);

  useEffect(() => {
    setData(loadData());
  }, []);

  if (!data || !data.profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Profile Required</h2>
        <p className="text-muted-foreground">Please complete your profile to view academic analytics.</p>
      </div>
    );
  }

  const semesters = data.semesters || [];
  
  // Backlog Logic
  const backlogs = data.profile.degree.backlogs;
  let backlogRisk = 'Low';
  let backlogColor = 'text-success';
  if (backlogs > 3) {
    backlogRisk = 'High';
    backlogColor = 'text-destructive';
  } else if (backlogs > 0) {
    backlogRisk = 'Moderate';
    backlogColor = 'text-gold';
  }

  // SGPA Logic
  const hasSemesters = semesters.length > 0;
  let highestSgpa = 0;
  let lowestSgpa = 10;
  let avgSgpa = 0;
  let trend = 'Stable';
  
  if (hasSemesters) {
    const sgpas = semesters.map(s => s.sgpa);
    highestSgpa = Math.max(...sgpas);
    lowestSgpa = Math.min(...sgpas);
    avgSgpa = sgpas.reduce((a, b) => a + b, 0) / sgpas.length;
    
    if (sgpas.length >= 2) {
      const last = sgpas[sgpas.length - 1];
      const prev = sgpas[sgpas.length - 2];
      if (last > prev + 0.2) trend = 'Improving';
      else if (last < prev - 0.2) trend = 'Declining';
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Academic Analytics</h1>
        <p className="text-sm md:text-base text-muted-foreground">Track your academic performance and backlog health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Stats */}
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Current CGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{data.profile.degree.cgpa}</div>
            <p className="text-xs text-muted-foreground mt-2">Target for most companies is 7.0+</p>
          </CardContent>
        </Card>
        
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Best SGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-success">{hasSemesters ? highestSgpa.toFixed(2) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-2">Your peak academic performance</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Active Backlogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${backlogColor}`}>{backlogs}</div>
            <p className="text-xs text-muted-foreground mt-2">Academic Risk: <span className={backlogColor}>{backlogRisk}</span></p>
          </CardContent>
        </Card>

        {/* SGPA Trend Chart */}
        <Card className="glass-panel md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> SGPA Trend Tracker
            </CardTitle>
            <CardDescription>Visualize your semester-over-semester performance.</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasSemesters ? (
              <div className="h-64 flex items-center justify-center border border-dashed border-border/50 rounded text-muted-foreground">
                No semester data added yet. Go to Dashboard to add.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={semesters} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis domain={[0, 10]} stroke="#888" fontSize={12} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1f2937', color: '#fff' }}
                      itemStyle={{ color: '#4361ee' }}
                    />
                    <Line type="monotone" dataKey="sgpa" stroke="#4361ee" strokeWidth={3} dot={{ r: 5, fill: '#4361ee' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {hasSemesters && (
              <div className="mt-6 p-4 bg-accent/5 rounded-lg border border-accent/20 flex items-start gap-3">
                {trend === 'Improving' ? <TrendingUp className="h-5 w-5 text-success shrink-0 mt-0.5" /> : 
                 trend === 'Declining' ? <TrendingDown className="h-5 w-5 text-destructive shrink-0 mt-0.5" /> : 
                 <Minus className="h-5 w-5 text-gold shrink-0 mt-0.5" />}
                <div>
                  <p className="font-semibold text-sm">Trend: {trend}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trend === 'Improving' ? 'Great job! Your SGPA has improved recently. Maintain this momentum.' : 
                     trend === 'Declining' ? 'Your SGPA has dipped recently. Identify weak subjects and allocate more study time.' :
                     'Your performance is stable. Try to push it slightly higher in the upcoming semester.'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backlog Health */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${backlogColor}`} /> Academic Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Placement Eligibility Impact</span>
                <span className="font-medium text-destructive">{backlogs > 0 ? 'High' : 'None'}</span>
              </div>
              <Progress value={backlogs === 0 ? 100 : Math.max(10, 100 - (backlogs * 25))} className={`h-2 ${backlogs === 0 ? 'bg-success' : 'bg-destructive'}`} />
            </div>

            <div className="p-4 bg-card/50 border border-border/50 rounded text-sm space-y-2">
              <p className="font-semibold">Recommendations:</p>
              <ul className="space-y-2 text-muted-foreground">
                {backlogs === 0 ? (
                  <li className="flex gap-2 items-start"><CheckCircle2 className="h-4 w-4 text-success shrink-0" /> Keep maintaining zero backlogs. It unlocks 100% of campus opportunities.</li>
                ) : (
                  <>
                    <li className="flex gap-2 items-start"><span className="text-destructive mt-0.5">•</span> Over 60% of top product companies strictly require zero active backlogs.</li>
                    <li className="flex gap-2 items-start"><span className="text-destructive mt-0.5">•</span> Your absolute highest priority before placement season is clearing these subjects.</li>
                    <li className="flex gap-2 items-start"><span className="text-destructive mt-0.5">•</span> Dedicate 2 hours daily specifically for backlog subjects.</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
