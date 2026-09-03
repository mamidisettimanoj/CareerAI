import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy, BookOpen, Target, Briefcase, Zap, AlertTriangle, ListTodo, Star } from 'lucide-react';
import { serverRepositories } from '@/services/ServerServiceLocator';
import { requireUser } from '@/lib/auth';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';

export default async function Dashboard() {
  const user = await requireUser();
  const profile = await serverRepositories.profile.getProfile();
  const semesters = await serverRepositories.academic.getSemesters();
  const engineResult = await serverRepositories.career.getEngineResult();
  const projects = await serverRepositories.project.getProjects();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <h2 className="text-2xl font-heading font-bold">Welcome to CareerAI Dashboard</h2>
        <p className="text-muted-foreground max-w-md">
          You haven&apos;t analyzed your profile yet. Fill in your details to generate your personalized career dashboard.
        </p>
        <Link href="/predict">
          <Button className="bg-primary hover:bg-primary/90 ">
            Analyze My Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const engine = engineResult || null;
  
  // Format data for SGPA trend chart
  const sgpaData = semesters.map(sem => ({
    name: sem.name,
    sgpa: sem.sgpa
  }));

  // Format data for Skills Radar
  const skillsData = [
    { subject: 'Technical', A: engine?.readiness.dimensions.technical.score || profile.skills.technicalScore, fullMark: 100 },
    { subject: 'Aptitude', A: profile.skills.employabilityScore, fullMark: 100 },
    { subject: 'Communication', A: profile.skills.communicationScore, fullMark: 100 },
    { subject: 'Academics', A: engine?.readiness.dimensions.academic.score || (profile.degree.cgpa / 10) * 100, fullMark: 100 },
    { subject: 'Experience', A: engine?.readiness.dimensions.resume.score || Math.min((profile.degree.workExperience * 5) + (profile.degree.internships * 15), 100), fullMark: 100 },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-success';
    if (val >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return 'Highly Competitive';
    if (score >= 60) return 'Placement Ready';
    return 'Needs Preparation';
  };

  const readinessScore = engine?.readiness.overallScore || 0;

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Career Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Overview of your academic and professional readiness.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/result">
            <Button variant="default" size="sm" className="w-full sm:w-auto">View Full Report</Button>
          </Link>
          <Link href="/predict">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">Update Profile</Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Readiness</CardTitle>
            <Trophy className={`h-4 w-4 ${getScoreColor(readinessScore)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readinessScore} <span className="text-sm text-muted-foreground font-normal">/ 100</span></div>
            <p className={`text-xs font-medium mt-1 ${getScoreColor(readinessScore)}`}>{getReadinessLabel(readinessScore)}</p>
          </CardContent>
        </Card>

        <Card >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current CGPA</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.degree.cgpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 10.0</p>
          </CardContent>
        </Card>

        <Card >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Target Role</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{profile.targetRole}</div>
            <p className="text-xs text-muted-foreground mt-1">Goal position</p>
          </CardContent>
        </Card>

        <Card >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(projects && projects.length > 0) ? projects.length : profile.skills.projectsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total portfolio items</p>
          </CardContent>
        </Card>
      </div>

      {engine && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Item */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-primary" /> What Should I Do Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              {engine.readiness.priorityImprovements.length > 0 ? (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-destructive text-white text-xs px-2 py-1 rounded font-bold">PRIORITY 1</span>
                    <span className="font-semibold">{engine.readiness.priorityImprovements[0].area}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-2">{engine.readiness.priorityImprovements[0].action}</p>
                  <p className="text-xs text-muted-foreground mt-1">Reason: {engine.readiness.priorityImprovements[0].reason}</p>
                </div>
              ) : (
                <div className="text-sm text-success flex items-center gap-2 mt-2">
                  <Star className="h-4 w-4" /> You are perfectly on track! Keep up the good work.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-success" /> Strongest Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-semibold text-sm">
                  {engine.readiness.topStrengths.length > 0 ? engine.readiness.topStrengths[0] : "Keep building your skills!"}
                </div>
              </CardContent>
            </Card>

            <Card >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Biggest Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-semibold text-sm">
                  {engine.readiness.priorityImprovements.length > 0 ? engine.readiness.priorityImprovements[0].area : "None"}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <DashboardCharts sgpaData={sgpaData} skillsData={skillsData} />
    </div>
  );
}


