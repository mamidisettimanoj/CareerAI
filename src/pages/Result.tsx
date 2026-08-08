import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadData } from '@/lib/storage';
import { calculatePlacementScore, generateRecommendations } from '@/lib/prediction';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { AppState } from '@/types';

export function Result() {
  const navigate = useNavigate();
  const [data, setData] = useState<AppState | null>(null);

  useEffect(() => {
    const stored = loadData();
    if (!stored.profile) {
      navigate('/predict');
    } else {
      setData(stored);
    }
  }, [navigate]);

  if (!data || !data.profile) return null;

  const { score, category } = calculatePlacementScore(data.profile);
  const recommendations = generateRecommendations(data.profile, score);

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-success';
    if (val >= 60) return 'text-gold';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Analysis Result</h1>
          <p className="text-muted-foreground">Based on your provided profile information.</p>
        </div>
        <Link to="/predict">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Score Card */}
        <Card className="glass-panel md:col-span-1 flex flex-col items-center justify-center text-center p-6 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 text-xs bg-primary/20 text-primary rounded-bl-lg font-medium">
            Estimate
          </div>
          <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-4">Placement Probability</CardTitle>
          
          <div className="relative h-40 w-40 flex items-center justify-center rounded-full border-8 border-muted mb-4">
            {/* Simple circular progress visualization */}
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
          <p className="text-xs text-muted-foreground">Target: {data.profile.targetRole}</p>
        </Card>

        {/* Breakdown Card */}
        <Card className="glass-panel md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Strength Breakdown</CardTitle>
            <CardDescription>How different factors contribute to your readiness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Academic Record (CGPA: {data.profile.degree.cgpa})</span>
                <span className="font-medium">{data.profile.degree.cgpa * 10}%</span>
              </div>
              <Progress value={data.profile.degree.cgpa * 10} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Aptitude & Reasoning</span>
                <span className="font-medium">{data.profile.skills.employabilityScore}%</span>
              </div>
              <Progress value={data.profile.skills.employabilityScore} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Technical Skills</span>
                <span className="font-medium">{data.profile.skills.technicalScore}%</span>
              </div>
              <Progress value={data.profile.skills.technicalScore} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Communication</span>
                <span className="font-medium">{data.profile.skills.communicationScore}%</span>
              </div>
              <Progress value={data.profile.skills.communicationScore} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
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

      {/* Recommendations */}
      <Card className="glass-panel border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" /> Actionable Recommendations
          </CardTitle>
          <CardDescription>Personalized steps to improve your placement readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 bg-accent/5 p-3 rounded-lg border border-accent/10">
                <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <div className="text-xs text-muted-foreground/60 text-center bg-card p-4 rounded-lg border border-border">
        <strong>Disclaimer:</strong> This Placement Probability Estimate is an educational analytics simulation based on common industry hiring patterns. It is <strong>not</strong> a scientifically validated machine learning model and does not guarantee real-world employment outcomes.
      </div>
    </div>
  );
}
