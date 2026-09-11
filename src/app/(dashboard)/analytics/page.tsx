"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BookOpen, Target, CheckCircle } from 'lucide-react';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';

export default function AnalyticsDashboard() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const semesters = useLiveQuery(() => db.semesters.toArray()) || [];
  const applications = useLiveQuery(() => db.applications.toArray()) || [];
  const goals = useLiveQuery(() => db.goals.toArray()) || [];
  const engineResult = useLiveQuery(() => db.engineResult.get('latest')) || null;

  if (!profile) return <div className="flex justify-center p-12">Loading Analytics...</div>;

  const sgpaData = semesters.map(sem => ({
    name: sem.name,
    sgpa: sem.sgpa
  }));

  const skillsData = [
    { subject: 'Technical', A: engineResult?.readiness.dimensions.technical.score || profile.skills.technicalScore, fullMark: 100 },
    { subject: 'Aptitude', A: profile.skills.employabilityScore, fullMark: 100 },
    { subject: 'Communication', A: profile.skills.communicationScore, fullMark: 100 },
    { subject: 'Academics', A: engineResult?.readiness.dimensions.academic.score || (profile.degree.cgpa / 10) * 100, fullMark: 100 },
    { subject: 'Experience', A: engineResult?.readiness.dimensions.resume.score || Math.min((profile.degree.workExperience * 5) + (profile.degree.internships * 15), 100), fullMark: 100 },
  ];

  // Application Funnel
  const saved = applications.filter(a => a.status === 'SAVED').length;
  const applied = applications.filter(a => a.status === 'APPLIED').length;
  const interviewing = applications.filter(a => a.status === 'INTERVIEWING').length;
  const offered = applications.filter(a => a.status === 'OFFERED').length;

  const completedGoals = goals.filter(g => g.status === 'Completed').length;
  const activeGoals = goals.filter(g => g.status === 'In Progress').length;

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
          <LineChart className="h-6 w-6 text-primary" aria-hidden="true" /> Cross-Module Analytics
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Unified view of your growth across academics, skills, and placements.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-2xl font-bold">{semesters.length}</h3>
            <p className="text-sm text-muted-foreground">Semesters Recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <Target className="h-8 w-8 text-success mb-2" />
            <h3 className="text-2xl font-bold">{completedGoals}</h3>
            <p className="text-sm text-muted-foreground">Goals Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <LineChart className="h-8 w-8 text-placement mb-2" />
            <h3 className="text-2xl font-bold">{applications.length}</h3>
            <p className="text-sm text-muted-foreground">Total Applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <CheckCircle className="h-8 w-8 text-portfolio mb-2" />
            <h3 className="text-2xl font-bold">{offered}</h3>
            <p className="text-sm text-muted-foreground">Offers Received</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts sgpaData={sgpaData} skillsData={skillsData} />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 text-right font-bold">{saved + applied + interviewing + offered}</div>
                <div className="flex-1 bg-muted h-6 rounded-md overflow-hidden relative">
                  <div className="bg-border h-full" style={{width: '100%'}}></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold z-10 text-foreground">Total Pipeline</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-right font-bold">{applied + interviewing + offered}</div>
                <div className="flex-1 bg-muted h-6 rounded-md overflow-hidden relative">
                  <div className="bg-primary/10 h-full" style={{width: `${Math.min(((applied+interviewing+offered)/(saved+applied+interviewing+offered || 1))*100, 100)}%`}}></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold z-10 text-foreground">Applied</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-right font-bold">{interviewing + offered}</div>
                <div className="flex-1 bg-muted h-6 rounded-md overflow-hidden relative">
                  <div className="bg-warning h-full" style={{width: `${Math.min(((interviewing+offered)/(applied+interviewing+offered || 1))*100, 100)}%`}}></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold z-10 text-warning-foreground">Interviewing</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-right font-bold">{offered}</div>
                <div className="flex-1 bg-muted h-6 rounded-md overflow-hidden relative">
                  <div className="bg-success/10 h-full" style={{width: `${Math.min(((offered)/(interviewing+offered || 1))*100, 100)}%`}}></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold z-10 text-white">Offered</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm font-bold">{goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{width: `${goals.length > 0 ? (completedGoals / goals.length) * 100 : 0}%`}}></div>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground justify-center">
                <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-primary inline-block"></span> {completedGoals} Completed</div>
                <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-muted inline-block border"></span> {activeGoals} Active</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
