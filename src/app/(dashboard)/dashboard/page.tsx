"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trophy, BookOpen, Target, Briefcase, ChevronRight, Zap, AlertTriangle, FileText, Code2, LineChart, GraduationCap } from 'lucide-react';
import { repositories } from '@/services/ServiceLocator';
import { careerService } from '@/services/CareerService';
import { UserProfile, SemesterData, ProjectData, IntelligenceResult, Goal, CertificationData } from '@/types';
import { Application } from '@/domain/placement/types/placement.types';
import { InternshipData, AchievementData } from '@/domain/portfolio/types/portfolio.types';
import { calculateProfileCompleteness } from '@/domain/profile/ProfileCompletenessEngine';

export default function StudentCommandCenter() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [semesters, setSemesters] = useState<SemesterData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [internships, setInternships] = useState<InternshipData[]>([]);
  const [certifications, setCertifications] = useState<CertificationData[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [engineResult, setEngineResult] = useState<IntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [p, s, pr, int, cert, app, er] = await Promise.all([
        repositories.profile.getProfile(),
        repositories.academic.getSemesters(),
        repositories.project.getProjects(),
        repositories.portfolio.getInternships(),
        repositories.portfolio.getCertifications(),
        repositories.placement.getApplications(),
        careerService.getCachedAnalysis()
      ]);
      setProfile(p);
      setSemesters(s);
      setProjects(pr);
      setInternships(int);
      setCertifications(cert);
      setApplications(app);
      setEngineResult(er);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]">Loading Command Center...</div>;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <h2 className="text-2xl font-bold">Welcome to CareerAI</h2>
        <p className="text-muted-foreground max-w-md">Complete your profile to unlock your personalized command center.</p>
        <Link href="/predict"><Button>Set Up Profile</Button></Link>
      </div>
    );
  }

  const readinessScore = engineResult?.readiness.overallScore || 0;
  const profileCompleteness = calculateProfileCompleteness(profile).percentage;


  // Placements metrics
  const applied = applications.filter(a => a.status === 'APPLIED').length;
  const interviewing = applications.filter(a => a.status === 'INTERVIEWING').length;
  const offered = applications.filter(a => a.status === 'OFFERED').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border/60 pb-4 sm:pb-6">
        <div className="min-w-0">
          <h1 className="page-title">
            Welcome back, {profile.personal.name || 'Student'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2 break-words">
            {profile.degree.type} • {profile.degree.branch} • Target: {profile.targetRole || 'Not set'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/today"><Button variant="default"><Zap className="h-4 w-4 mr-2" /> Daily Plan</Button></Link>
          <Link href="/analytics"><Button variant="outline"><LineChart className="h-4 w-4 mr-2" /> Analytics</Button></Link>
        </div>
      </div>

      {/* Core KPIs */}
      <div className="kpi-grid">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col justify-center p-4 sm:p-5 min-h-[110px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Career Readiness</p>
            <div className="text-3xl font-bold mt-2 text-primary">{readinessScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col justify-center p-4 sm:p-5 min-h-[110px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CGPA</p>
            <div className="text-3xl font-bold mt-2">{profile.degree.cgpa.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col justify-center p-4 sm:p-5 min-h-[110px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applications</p>
            <div className="text-3xl font-bold mt-2">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col justify-center p-4 sm:p-5 min-h-[110px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interviews</p>
            <div className="text-3xl font-bold mt-2">{interviewing}</div>
          </CardContent>
        </Card>
        <Card className="hidden sm:block">
          <CardContent className="flex flex-col justify-center p-4 sm:p-5 min-h-[110px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Health</p>
            <div className="text-3xl font-bold mt-2">{profileCompleteness}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="responsive-grid">
        
        {/* Academic Snapshot */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex justify-between items-center">
              <span className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-500" /> Academic</span>
              <Link href="/academic" className="text-xs text-primary hover:underline flex items-center">View <ChevronRight className="h-3 w-3" /></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Active Backlogs</span>
              <span className={`font-bold ${profile.degree.backlogs > 0 ? 'text-destructive' : 'text-success'}`}>{profile.degree.backlogs}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Semesters Recorded</span>
              <span className="font-bold">{semesters.length}</span>
            </div>
            {engineResult?.readiness.priorityImprovements.find(p => p.area === 'Academic') && (
               <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-md flex gap-2">
                 <AlertTriangle className="h-4 w-4 shrink-0" />
                 <span>You have critical academic improvements needed.</span>
               </div>
            )}
          </CardContent>
        </Card>

        {/* Placement Snapshot */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex justify-between items-center">
              <span className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-500" /> Placement Pipeline</span>
              <Link href="/placement" className="text-xs text-primary hover:underline flex items-center">View <ChevronRight className="h-3 w-3" /></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Applied</span><span className="font-bold">{applied}</span></div>
              <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${Math.min((applied/10)*100, 100)}%`}}></div></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Interviewing</span><span className="font-bold text-yellow-600">{interviewing}</span></div>
              <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${Math.min((interviewing/5)*100, 100)}%`}}></div></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Offers</span><span className="font-bold text-success">{offered}</span></div>
              <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{width: `${Math.min((offered/1)*100, 100)}%`}}></div></div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Snapshot */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex justify-between items-center">
              <span className="flex items-center gap-2"><FileText className="h-5 w-5 text-green-500" /> Portfolio</span>
              <Link href="/portfolio" className="text-xs text-primary hover:underline flex items-center">View <ChevronRight className="h-3 w-3" /></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-2xl font-bold">{projects.length}</div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-2xl font-bold">{internships.length}</div>
                <div className="text-xs text-muted-foreground">Internships</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-2xl font-bold">{certifications.length}</div>
                <div className="text-xs text-muted-foreground">Certifications</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-2xl font-bold">{engineResult?.readiness.dimensions.resume.score || 0}</div>
                <div className="text-xs text-muted-foreground">Resume Score</div>
              </div>
            </div>
            {projects.length === 0 && (
              <p className="text-xs text-warning flex gap-1 items-center"><AlertTriangle className="h-3 w-3"/> Missing project evidence</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
