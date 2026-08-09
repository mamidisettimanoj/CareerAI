import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadData, saveData } from '@/lib/storage';
import { analyzeCareerProfile } from '@/lib/careerEngine';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, Bot, RefreshCw, XCircle, Target, CalendarDays, ListTodo } from 'lucide-react';
import { AppState, CareerEngineResult } from '@/types';

export function Result() {
  const navigate = useNavigate();
  const [data, setData] = useState<AppState | null>(null);
  const [engineResult, setEngineResult] = useState<CareerEngineResult | null>(null);

  useEffect(() => {
    const stored = loadData();
    if (!stored.profile) {
      navigate('/predict');
      return;
    }
    setData(stored);

    // Use cached result or generate synchronously
    if (stored.engineResult) {
      setEngineResult(stored.engineResult);
    } else {
      generateAnalysis(stored);
    }
  }, [navigate]);

  const generateAnalysis = (appData: AppState) => {
    if (!appData.profile) return;
    
    try {
      const result = analyzeCareerProfile(appData);
      setEngineResult(result);
      saveData({ engineResult: result });
    } catch (error) {
      console.error(error);
    }
  };

  if (!data || !data.profile || !engineResult) return null;

  const score = engineResult.readinessScore;
  let category = 'Needs Improvement';
  if (score >= 80) category = 'Highly Competitive';
  else if (score >= 60) category = 'Placement Ready';

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-success';
    if (val >= 60) return 'text-gold';
    return 'text-destructive';
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-8 min-w-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Analysis Result</h1>
          <p className="text-sm md:text-base text-muted-foreground">Your personalized career readiness assessment.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/predict">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => generateAnalysis(data)} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Score Card */}
        <Card className="glass-panel lg:col-span-1 flex flex-col items-center justify-center text-center p-6 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 text-xs bg-primary/20 text-primary rounded-bl-lg font-medium">
            Estimate
          </div>
          <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-4">Placement Readiness</CardTitle>
          
          <div className="relative h-40 w-40 flex items-center justify-center rounded-full border-8 border-muted mb-4">
            <div 
              className={`absolute inset-0 rounded-full border-8 ${score >= 75 ? 'border-success' : score >= 60 ? 'border-gold' : 'border-destructive'}`}
              style={{ clipPath: `polygon(0 0, 100% 0, 100% ${score}%, 0 ${score}%)`, transform: 'rotate(-90deg)' }}
            />
            <div className="flex flex-col items-center justify-center z-10">
              <span className="text-5xl font-bold">{score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          
          <div className={`text-xl font-heading font-bold ${getScoreColor(score)} mb-2`}>
            {category}
          </div>
          <p className="text-sm text-muted-foreground font-medium">Target Role:</p>
          <p className="text-base font-bold text-foreground">{data.profile.targetRole}</p>
        </Card>

        {/* Profile Strength Breakdown */}
        <Card className="glass-panel lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Strength</CardTitle>
            <CardDescription>Breakdown of your core readiness factors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Academic</span>
                  <span className="font-medium">{engineResult.academicScore}%</span>
                </div>
                <Progress value={engineResult.academicScore} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Aptitude</span>
                  <span className="font-medium">{data.profile.skills.employabilityScore}%</span>
                </div>
                <Progress value={data.profile.skills.employabilityScore} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Technical Skills</span>
                  <span className="font-medium">{engineResult.technicalScore}%</span>
                </div>
                <Progress value={engineResult.technicalScore} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Communication</span>
                  <span className="font-medium">{data.profile.skills.communicationScore}%</span>
                </div>
                <Progress value={data.profile.skills.communicationScore} className="h-2" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50 mt-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Projects & Internships</span>
                <span className="text-lg font-medium">{data.profile.skills.projectsCount} / {data.profile.degree.internships}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Active Backlogs</span>
                <span className={`text-lg font-medium ${data.profile.degree.backlogs > 0 ? 'text-destructive' : 'text-success'}`}>
                  {data.profile.degree.backlogs}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* INTELLIGENCE SECTION */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold">Career Intelligence Engine</h2>
            <p className="text-sm text-muted-foreground">Your deterministic, localized career assessment.</p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-lg leading-relaxed">{engineResult.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-panel border-success/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-success" /> Top Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {engineResult.topStrengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-success mt-1">•</span> {strength}
                    </li>
                  ))}
                  {engineResult.topStrengths.length === 0 && (
                    <li className="text-sm text-muted-foreground italic">No prominent strengths identified yet. Keep working!</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-panel border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Priority Improvements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {engineResult.priorityImprovements.map((imp, i) => (
                  <div key={i} className="bg-destructive/5 p-3 rounded border border-destructive/10">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">{imp.area}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${imp.priority === 'HIGH' ? 'bg-destructive text-white' : 'bg-gold text-black'}`}>
                        {imp.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{imp.reason}</p>
                    <p className="text-sm font-medium">Action: {imp.action}</p>
                  </div>
                ))}
                {engineResult.priorityImprovements.length === 0 && (
                  <p className="text-sm text-success">Excellent! You have no critical weaknesses at this stage.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="glass-panel">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" /> Target Role Match: {data.profile.targetRole}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl font-bold text-primary">{engineResult.roleMatch.score}%</div>
                <Progress value={engineResult.roleMatch.score} className="h-3 flex-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {engineResult.roleMatch.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-card/50 border border-border/40 text-sm">
                    <span>{item.skill}</span>
                    {item.status === 'match' ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : item.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-gold" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-panel">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListTodo className="h-5 w-5 text-accent" /> 7-Day Career Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {engineResult.sevenDayPlan.map((day) => (
                    <div key={day.day} className="flex gap-3">
                      <div className="flex flex-col items-center mt-1">
                        <div className="h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
                          {day.day}
                        </div>
                        {day.day !== 7 && <div className="w-px h-full bg-border/50 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="font-semibold text-sm">{day.focus}</p>
                        <p className="text-xs text-muted-foreground mt-1">{day.task}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5 text-cyan-400" /> 30-Day Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {engineResult.thirtyDayRoadmap.map((week) => (
                    <div key={week.week} className="bg-cyan-400/5 border border-cyan-400/10 p-3 rounded-lg">
                      <div className="text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wider">Week {week.week}: {week.theme}</div>
                      <ul className="space-y-1 mt-2">
                        {week.goals.map((goal, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-cyan-400 opacity-50 mt-1">•</span> {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground/60 text-center bg-card p-4 rounded-lg border border-border mt-8">
        <strong>Disclaimer:</strong> This is a career readiness estimate and educational guidance tool. It does not guarantee placement or employment.
      </div>
    </div>
  );
}
