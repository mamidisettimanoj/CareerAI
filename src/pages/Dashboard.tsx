import { useEffect, useState } from 'react';
import { loadData } from '@/lib/storage';
import { AppState } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy, BookOpen, Target, Briefcase } from 'lucide-react';
import { calculatePlacementScore } from '@/lib/prediction';

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

  const { score, category } = calculatePlacementScore(data.profile);
  
  // Format data for SGPA trend chart
  const sgpaData = data.semesters.map(sem => ({
    name: sem.name,
    sgpa: sem.sgpa
  }));

  // Format data for Skills Radar
  const skillsData = [
    { subject: 'Technical', A: data.profile.skills.technicalScore, fullMark: 100 },
    { subject: 'Aptitude', A: data.profile.skills.employabilityScore, fullMark: 100 },
    { subject: 'Communication', A: data.profile.skills.communicationScore, fullMark: 100 },
    { subject: 'Academics', A: (data.profile.degree.cgpa / 10) * 100, fullMark: 100 },
    { subject: 'Experience', A: Math.min((data.profile.degree.workExperience * 5) + (data.profile.degree.internships * 15), 100), fullMark: 100 },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-success';
    if (val >= 60) return 'text-gold';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold">Career Dashboard</h1>
          <p className="text-muted-foreground">Overview of your academic and professional readiness.</p>
        </div>
        <Link to="/predict">
          <Button variant="outline" size="sm">Update Profile</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Placement Readiness</CardTitle>
            <Trophy className={`h-4 w-4 ${getScoreColor(score)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{score} <span className="text-sm text-muted-foreground font-normal">/ 100</span></div>
            <p className={`text-xs font-medium mt-1 ${getScoreColor(score)}`}>{category}</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects / Internships</CardTitle>
            <Briefcase className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.profile.skills.projectsCount} / {data.profile.degree.internships}</div>
            <p className="text-xs text-muted-foreground mt-1">Total completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SGPA Trend */}
        <Card className="glass-panel col-span-1">
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
        <Card className="glass-panel col-span-1">
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
