import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { requireUser } from '@/lib/auth';
import { AcademicCharts } from '@/components/academic/AcademicCharts';
import { analyzeAcademicRecord } from '@/domain/academic/engine/AcademicIntelligenceEngine';

export default async function Academic() {
  await requireUser();
  const profile = await serverRepositories.profile.getProfile();
  
  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Profile Required</h2>
        <p className="text-muted-foreground">Please complete your profile to view academic analytics.</p>
      </div>
    );
  }

  const semesters = await serverRepositories.academic.getSemesters();
  
  // Use Academic Intelligence Engine
  const intelligence = analyzeAcademicRecord({
    cgpa: profile.degree.cgpa,
    percentage: profile.degree.percentage,
    activeBacklogs: profile.degree.backlogs,
    historicalBacklogs: 0,
    semesters: semesters.map(s => ({
      id: s.id,
      termNumber: parseInt(s.name.replace('Semester ', '')) || 0,
      sgpa: s.sgpa,
      credits: s.credits
    }))
  });

  const backlogs = profile.degree.backlogs;
  
  let backlogRisk = 'Low';
  let backlogColor = 'text-success';
  if (intelligence.backlogStatus === 'ACTIVE') {
    if (backlogs > 3) {
      backlogRisk = 'High';
      backlogColor = 'text-destructive';
    } else {
      backlogRisk = 'Moderate';
      backlogColor = 'text-gold';
    }
  }

  const hasSemesters = semesters.length > 0;
  const highestSgpa = intelligence.metrics.bestSgpa;
  const trend = intelligence.trend.charAt(0) + intelligence.trend.slice(1).toLowerCase();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Academic Analytics</h1>
        <p className="text-sm md:text-base text-muted-foreground">Track your academic performance and backlog health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Stats */}
        <Card >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Current CGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{profile.degree.cgpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">Target for most companies is 7.0+</p>
          </CardContent>
        </Card>
        
        <Card >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Best SGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-success">{highestSgpa !== null ? highestSgpa.toFixed(2) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-2">Your peak academic performance</p>
          </CardContent>
        </Card>

        <Card >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Active Backlogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${backlogColor}`}>{backlogs}</div>
            <p className="text-xs text-muted-foreground mt-2">Academic Risk: <span className={backlogColor}>{backlogRisk}</span></p>
          </CardContent>
        </Card>

        {/* SGPA Trend Chart */}
        <AcademicCharts semesters={semesters} hasSemesters={hasSemesters} trend={trend.replace('_', ' ')} />

        {/* Backlog Health */}
        <Card >
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


