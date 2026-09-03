'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AssessmentResultClientProps {
  attempt: any;
  intelligence: any;
}

export function AssessmentResultClient({ attempt, intelligence }: AssessmentResultClientProps) {
  const router = useRouter();
  const res = attempt.result;
  const assessment = attempt.version.assessment;

  const trendIcon = () => {
    switch (intelligence.historicalTrend) {
      case 'IMPROVING': return <TrendingUp className="h-5 w-5 text-success" />;
      case 'DECLINING': return <TrendingDown className="h-5 w-5 text-destructive" />;
      case 'STABLE': return <Minus className="h-5 w-5 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/assessments')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assessments
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Score */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{assessment.title} - Results</CardTitle>
            <CardDescription>Authoritative Server-Calculated Score</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className={`text-6xl font-bold mb-4 ${res.percentage >= 80 ? 'text-success' : res.percentage >= 50 ? 'text-gold' : 'text-destructive'}`}>
              {res.percentage}%
            </div>
            <Progress value={res.percentage} className="h-3 w-full max-w-md" />
            
            <div className="flex gap-8 mt-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span><span className="font-bold">{res.correct}</span> Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <span><span className="font-bold">{res.incorrect}</span> Incorrect</span>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span><span className="font-bold">{res.unanswered}</span> Unanswered</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intelligence / Category Breakdown */}
        <div className="space-y-6">
          <Card >
            <CardHeader>
              <CardTitle className="text-lg">Category Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(res.categoryScores || {}).map(([cat, score]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{cat}</span>
                    <span className="font-bold">{Number(score).toFixed(0)}%</span>
                  </div>
                  <Progress value={Number(score)} className="h-1.5" />
                </div>
              ))}
              {Object.keys(res.categoryScores || {}).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No category breakdown available.
                </div>
              )}
            </CardContent>
          </Card>

          <Card >
            <CardHeader>
              <CardTitle className="text-lg">Historical Trend</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm font-medium">{intelligence.historicalTrend.replace('_', ' ')}</span>
              {trendIcon()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
