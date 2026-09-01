"use client";

import { useEffect, useState } from 'react';
import { loadData } from '@/lib/storage';
import { AppState, CareerEngineResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy, BookOpen, Target, Briefcase, Zap, AlertTriangle, ListTodo, Star } from 'lucide-react';

export function Dashboard() {
  const [data, setData] = useState<AppState | null>(null);

  useEffect(() => {
    setData(loadData());
  }, []);

  if (!data || !data.profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <h2 className="text-2xl font-heading font-bold">Welcome to CareerAI Dashboard</h2>
        <p className="text-muted-foreground max-w-md">
          You haven't analyzed your profile yet. Fill in your details to generate your personalized career dashboard.
        </p>
        <Link to="/predict">
          <Button className="bg-primary hover:bg-primary/90 glow-primary">
            Analyze My Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const engine: CareerEngineResult | null = data.engineResult || null;
  
  // Format data for SGPA trend chart
  const sgpaData = (data.semesters || []).map(sem => ({
    name: sem.name,
    sgpa: sem.sgpa
  }));

  // Format data for Skills Radar
  const skillsData = [
    { subject: 'Technical', A: engine?.technicalScore || data.profile.skills.technicalScore, fullMark: 100 },
    { subject: 'Aptitude', A: data.profile.skills.employabilityScore, fullMark: 100 },
    { subject: 'Communication', A: data.profile.skills.communicationScore, fullMark: 100 },
    { subject: 'Academics', A: engine?.academicScore || (data.profile.degree.cgpa / 10) * 100, fullMark: 100 },
    { subject: 'Experience', A: engine?.resumeScore || Math.min((data.profile.degree.workExperience * 5) + (data.profile.degree.internships * 15), 100), fullMark: 100 },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-success';
    if (val >= 60) return 'text-gold';
    return 'text-destructive';
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return 'Highly Competitive';
    if (score >= 60) return 'Placement Ready';
    return 'Needs Preparation';
  };

  const readinessScore = engine?.readinessScore || 0;

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Career Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Overview of your academic and professional readiness.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/result">
            <Button variant="default" size="sm" className="w-full sm:w-auto">View Full Report</Button>
          </Link>
          <Link to="/predict">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">Update Profile</Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Readiness</CardTitle>
            <Trophy className={`h-4 w-4 ${getScoreColor(readinessScore)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readinessScore} <span className="text-sm text-muted-foreground font-normal">/ 100</span></div>
            <p className={`text-xs font-medium mt-1 ${getScoreColor(readinessScore)}`}>{getReadinessLabel(readinessScore)}</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current CGPA</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.profile.degree.cgpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 10.0</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Target Role</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{data.profile.targetRole}</div>
            <p className="text-xs text-muted-foreground mt-1">Goal position</p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.projects && data.projects.length > 0) ? data.projects.length : data.profile.skills.projectsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total portfolio items</p>
          </CardContent>
        </Card>
      </div>

      {engine && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Item */}
          <Card className="glass-panel border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" /> What Should I Do Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              {engine.priorityImprovements.length > 0 ? (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-destructive text-white text-xs px-2 py-1 rounded font-bold">PRIORITY 1</span>
                    <span className="font-semibold">{engine.priorityImprovements[0].area}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-2">{engine.priorityImprovements[0].action}</p>
                  <p className="text-xs text-muted-foreground mt-1">Reason: {engine.priorityImprovements[0].reason}</p>
                </div>
              ) : (
                <div className="text-sm text-success flex items-center gap-2 mt-2">
                  <Star className="h-4 w-4" /> You are perfectly on track! Keep up the good work.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-success" /> Strongest Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-semibold text-sm">
                  {engine.topStrengths.length > 0 ? engine.topStrengths[0] : "Keep building your skills!"}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gold" /> Biggest Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-semibold text-sm">
                  {engine.priorityImprovements.length > 0 ? engine.priorityImprovements[0].area : "None"}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SGPA Trend */}
        <Card className="glass-panel w-full">
          <CardHeader>
            <CardTitle>SGPA Trend</CardTitle>
            <CardDescription>Your academic performance across semesters</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {sgpaData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sgpaData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#4361EE' }}
                  />
                  <Line type="monotone" dataKey="sgpa" stroke="#4361EE" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground flex-col">
                <p>No semester data available.</p>
                <Link to="/academic" className="text-primary mt-2 hover:underline">Add Semesters</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skill Radar */}
        <Card className="glass-panel w-full">
          <CardHeader>
            <CardTitle>Skill Profile Radar</CardTitle>
            <CardDescription>Visual breakdown of your readiness factors</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="#F72585" fill="#F72585" fillOpacity={0.4} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#333', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
