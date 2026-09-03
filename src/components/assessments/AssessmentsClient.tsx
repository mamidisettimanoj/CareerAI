'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { startAssessmentAttemptAction } from '@/actions/assessment';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, CheckCircle2, Clock } from 'lucide-react';

interface AssessmentsClientProps {
  availableAssessments: any[];
  latestResults: Record<string, any>;
}

export function AssessmentsClient({ availableAssessments, latestResults }: AssessmentsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [starting, setStarting] = useState<string | null>(null);

  const handleStart = async (versionId: string, title: string) => {
    setStarting(versionId);
    try {
      const attempt = await startAssessmentAttemptAction(versionId);
      router.push(`/assessments/${attempt.id}/take`);
    } catch (error: any) {
      toast({ title: 'Failed to start assessment', description: error.message, variant: 'destructive' });
      setStarting(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {availableAssessments.map(assessment => {
        const latestVersion = assessment.versions[0];
        if (!latestVersion) return null;

        const catResult = latestResults[assessment.category];
        const isCompleted = !!catResult;

        return (
          <Card key={assessment.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/20 text-primary uppercase tracking-wider">
                  {assessment.category}
                </span>
                {isCompleted && <CheckCircle2 className="h-5 w-5 text-success" />}
              </div>
              <CardTitle>{assessment.title}</CardTitle>
              <CardDescription className="line-clamp-2">{assessment.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {assessment.duration || 30} mins
                </div>
                <div>
                  {latestVersion._count?.questions || 0} Questions
                </div>
              </div>

              {isCompleted && catResult && (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Latest Score</span>
                    <span className="font-bold">{catResult.percentage}%</span>
                  </div>
                  <Progress value={catResult.percentage} className="h-2" />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleStart(latestVersion.id, assessment.title)}
                disabled={starting === latestVersion.id}
                variant={isCompleted ? "outline" : "default"}
              >
                {starting === latestVersion.id ? 'Starting...' : isCompleted ? 'Retake Assessment' : 'Start Assessment'}
                {!starting && <PlayCircle className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
      
      {availableAssessments.length === 0 && (
        <div className="col-span-full p-8 text-center border border-dashed rounded-lg text-muted-foreground">
          No assessments are currently published.
        </div>
      )}
    </div>
  );
}
