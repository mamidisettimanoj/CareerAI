"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { analyzeAcademicRecord } from '@/domain/academic/engine/AcademicIntelligenceEngine';
import { AcademicCharts } from '@/components/academic/AcademicCharts';
import { TrendingUp, TrendingDown, Minus, Info, Target, AlertTriangle } from 'lucide-react';

export default function AcademicAnalyticsPage() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const semesters = useLiveQuery(() => db.semesters.toArray())?.sort((a, b) => (a.semesterNumber || 0) - (b.semesterNumber || 0)) || [];
  const backlogs = useLiveQuery(() => db.backlogs.toArray()) || [];

  if (profile === undefined) {
    return <div className="py-12 text-center text-muted-foreground">Loading analytics...</div>;
  }

  const activeBacklogsCount = backlogs.filter(b => b.status === 'Active').length;
  const clearedBacklogsCount = backlogs.filter(b => b.status === 'Cleared').length;

  const validSemesters = semesters.map(s => ({
    id: s.id,
    termNumber: s.semesterNumber || parseInt(s.name.replace('Semester ', '')) || 0,
    sgpa: s.sgpa,
    credits: s.credits
  }));

  const intelligence = analyzeAcademicRecord({
    cgpa: profile?.degree?.cgpa || null,
    percentage: profile?.degree?.percentage || null,
    activeBacklogs: activeBacklogsCount,
    historicalBacklogs: clearedBacklogsCount,
    semesters: validSemesters
  });

  const { trend, consistencyScore, metrics, warnings } = intelligence;

  const TrendIcon = trend === 'IMPROVING' ? TrendingUp : trend === 'DECLINING' ? TrendingDown : Minus;
  const trendColor = trend === 'IMPROVING' ? 'text-success' : trend === 'DECLINING' ? 'text-destructive' : 'text-muted-foreground';

  // Find best and worst semester details
  const bestSem = semesters.find(s => s.sgpa === metrics.bestSgpa);
  const worstSem = semesters.find(s => s.sgpa === metrics.lowestSgpa);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Academic Analytics</h2>
        <p className="text-sm text-muted-foreground">Deep dive into your performance trends and consistency.</p>
      </div>

      {warnings.length > 0 && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex flex-col gap-2 text-sm">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {w}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Performance Trend</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className={`text-xl font-bold ${trendColor}`}>{trend.replace('_', ' ')}</span>
            <TrendIcon className={`h-8 w-8 ${trendColor} opacity-50`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Consistency Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {consistencyScore !== null ? `${consistencyScore.toFixed(0)}/100` : 'N/A'}
            </div>
            {consistencyScore !== null && (
               <p className="text-xs text-muted-foreground mt-1">
                 {consistencyScore > 80 ? 'Highly consistent grades' : consistencyScore > 50 ? 'Moderate fluctuations' : 'High volatility in grades'}
               </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Best Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{metrics.bestSgpa?.toFixed(2) || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">{bestSem ? bestSem.name : 'No data'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Weakest Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{metrics.lowestSgpa?.toFixed(2) || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">{worstSem ? worstSem.name : 'No data'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AcademicCharts semesters={semesters} hasSemesters={semesters.length > 0} trend={trend.replace('_', ' ')} />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Intelligence Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p>Your average SGPA across all tracked semesters is <strong>{metrics.averageSgpa?.toFixed(2) || '-'}</strong>.</p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p>
                  {trend === 'IMPROVING' 
                    ? 'You have shown a clear upward trajectory in your recent semesters. Keep up this momentum.' 
                    : trend === 'DECLINING' 
                    ? 'Your grades have been slipping recently. It is highly recommended to identify weak subjects and focus on them next term.'
                    : trend === 'STABLE'
                    ? 'You are maintaining a steady academic performance.'
                    : 'Add more semester data to unlock trend analysis.'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p>
                  {activeBacklogsCount === 0 
                    ? 'You have no active backlogs, which puts you in an excellent position for placement eligibility.' 
                    : `You have ${activeBacklogsCount} active backlogs. Clearing these should be your absolute highest priority.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
