"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { DSA_PROBLEMS } from '@/data/questions/dsa';
import { APTITUDE_QUESTIONS } from '@/data/questions/aptitude';
import { TECHNICAL_QUESTIONS } from '@/data/questions/technical';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileWarning } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ReviewCenter() {
  const dsaAttempts = useLiveQuery(() => db.dsaAttempts.toArray()) || [];
  const aptitudeAttempts = useLiveQuery(() => db.aptitudeAttempts.toArray()) || [];
  const technicalAttempts = useLiveQuery(() => db.technicalAttempts.toArray()) || [];

  // Get failed DSA problems (latest attempt is failed)
  const failedDsaIds = Array.from(new Set(dsaAttempts.filter(a => !a.solved).map(a => a.problemId)));
  const solvedDsaIds = new Set(dsaAttempts.filter(a => a.solved).map(a => a.problemId));
  const reviewDsa = DSA_PROBLEMS.filter(p => failedDsaIds.includes(p.id) && !solvedDsaIds.has(p.id));

  const incorrectAptIds = Array.from(new Set(aptitudeAttempts.filter(a => !a.isCorrect).map(a => a.questionId)));
  const correctAptIds = new Set(aptitudeAttempts.filter(a => a.isCorrect).map(a => a.questionId));
  const reviewApt = APTITUDE_QUESTIONS.filter(p => incorrectAptIds.includes(p.id) && !correctAptIds.has(p.id));

  const incorrectTechIds = Array.from(new Set(technicalAttempts.filter(a => !a.isCorrect).map(a => a.questionId)));
  const correctTechIds = new Set(technicalAttempts.filter(a => a.isCorrect).map(a => a.questionId));
  const reviewTech = TECHNICAL_QUESTIONS.filter(p => incorrectTechIds.includes(p.id) && !correctTechIds.has(p.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <FileWarning className="h-6 w-6 text-destructive" /> Needs Attention
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Review topics and questions you struggled with.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {reviewDsa.length > 0 && (
          <Card className="border-destructive/20">
            <CardHeader className="bg-destructive/5 pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">DSA Problems to Retry</CardTitle>
              <CardDescription>You marked these problems as failed. Try them again.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {reviewDsa.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h4 className="font-bold">{p.title}</h4>
                    <p className="text-xs text-muted-foreground">{p.topic}</p>
                  </div>
                  <Link href="/preparation/dsa"><Button variant="outline" size="sm">Go to DSA</Button></Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {reviewApt.length > 0 && (
          <Card className="border-destructive/20">
            <CardHeader className="bg-destructive/5 pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">Incorrect Aptitude Questions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {reviewApt.map(q => (
                <div key={q.id} className="p-4 border rounded-lg space-y-2 bg-muted/10">
                  <Badge variant="outline" className="mb-2">{q.topic}</Badge>
                  <p className="font-medium text-sm">{q.question}</p>
                  <div className="p-3 bg-success/10 border-success/30 border rounded text-sm text-success-foreground">
                    <span className="font-bold">Correct Answer:</span> {q.correctAnswer}
                    <p className="mt-1 text-xs opacity-80">{q.explanation}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2"><Link href="/preparation/aptitude"><Button variant="outline">Practice Aptitude Again</Button></Link></div>
            </CardContent>
          </Card>
        )}

        {reviewTech.length > 0 && (
          <Card className="border-destructive/20">
            <CardHeader className="bg-destructive/5 pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">Incorrect Technical MCQs</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {reviewTech.map(q => (
                <div key={q.id} className="p-4 border rounded-lg space-y-2 bg-muted/10">
                  <Badge variant="outline" className="mb-2">{q.topic}</Badge>
                  <p className="font-medium text-sm">{q.question}</p>
                  <div className="p-3 bg-success/10 border-success/30 border rounded text-sm text-success-foreground">
                    <span className="font-bold">Correct Answer:</span> {q.correctAnswer}
                    <p className="mt-1 text-xs opacity-80">{q.explanation}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2"><Link href="/preparation/technical"><Button variant="outline">Practice Tech Again</Button></Link></div>
            </CardContent>
          </Card>
        )}

        {reviewDsa.length === 0 && reviewApt.length === 0 && reviewTech.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-foreground">You're all caught up!</h3>
            <p>You have no pending failed questions to review.</p>
          </div>
        )}

      </div>
    </div>
  );
}
