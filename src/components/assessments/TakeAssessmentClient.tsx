'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { submitAssessmentAttemptAction } from '@/actions/assessment';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AssessmentAnswerDef } from '@/domain/assessment/types/assessment.types';

interface TakeAssessmentClientProps {
  attempt: any; // Omitted isCorrect for security
}

export function TakeAssessmentClient({ attempt }: TakeAssessmentClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  const questions = attempt.version.questions;
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: AssessmentAnswerDef[] = questions.map((q: any) => ({
        questionId: q.id,
        optionId: answers[q.id] || null
      }));

      await submitAssessmentAttemptAction(attempt.id, payload);
      toast({ title: 'Assessment submitted successfully' });
      router.push(`/assessments/results/${attempt.id}`);
    } catch (error: any) {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <Card className="min-h-[500px] flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{attempt.version.assessment.title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        <h3 className="text-lg font-medium">{currentQ.text}</h3>
        
        <div className="space-y-3">
          {currentQ.options.map((opt: any) => {
            const isSelected = answers[currentQ.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(currentQ.id, opt.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/10 text-primary-foreground' 
                    : 'border-border/50 hover:border-primary/50 hover:bg-card/50'
                }`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-border/50 pt-6">
        <Button 
          variant="outline" 
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          Previous
        </Button>

        {currentIdx === questions.length - 1 ? (
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        ) : (
          <Button 
            onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
          >
            Next
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
