"use client";

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Brain, Code2, Target, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function PreparationDashboard() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const dsaAttempts = useLiveQuery(() => db.dsaAttempts.toArray()) || [];
  const aptitudeAttempts = useLiveQuery(() => db.aptitudeAttempts.toArray()) || [];
  const technicalAttempts = useLiveQuery(() => db.technicalAttempts.toArray()) || [];
  const mocks = useLiveQuery(() => db.mockTests.toArray()) || [];
  const streak = useLiveQuery(() => db.streaks.get('global'));

  const totalDsaSolved = dsaAttempts.filter(a => a.solved).length;
  const aptAccuracy = aptitudeAttempts.length ? (aptitudeAttempts.filter(a => a.isCorrect).length / aptitudeAttempts.length) * 100 : 0;
  const techAccuracy = technicalAttempts.length ? (technicalAttempts.filter(a => a.isCorrect).length / technicalAttempts.length) * 100 : 0;
  
  const recentMocks = mocks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  const avgMockScore = mocks.length ? mocks.reduce((acc, m) => acc + m.score, 0) / mocks.length : 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Preparation Intelligence Center
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Track your placement preparation across DSA, Aptitude, and Core Technical subjects.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm flex gap-1 items-center bg-primary/10 border-primary/20">
            🔥 {streak?.currentStreak || 0} Day Streak
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Cards */}
        <Link href="/preparation/dsa" className="md:col-span-1">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Code2 className="h-5 w-5 text-blue-500" /> DSA Center</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDsaSolved} <span className="text-sm font-normal text-muted-foreground">Solved</span></div>
              <Progress value={Math.min(100, (totalDsaSolved / 150) * 100)} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/preparation/aptitude" className="md:col-span-1">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-green-500" /> Aptitude</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aptAccuracy.toFixed(0)}% <span className="text-sm font-normal text-muted-foreground">Accuracy</span></div>
              <Progress value={aptAccuracy} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/preparation/technical" className="md:col-span-1">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-orange-500" /> Core Tech</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{techAccuracy.toFixed(0)}% <span className="text-sm font-normal text-muted-foreground">Accuracy</span></div>
              <Progress value={techAccuracy} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/preparation/mock-tests" className="md:col-span-1">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Mock Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{avgMockScore.toFixed(0)}% <span className="text-sm font-normal text-muted-foreground">Avg Score</span></div>
              <p className="text-xs text-muted-foreground mt-2">{mocks.length} tests taken</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Mock Tests</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMocks.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No mock tests taken yet. Start one today!</p>
            ) : (
              <ul className="space-y-4">
                {recentMocks.map(m => (
                  <li key={m.id} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                    <div>
                      <p className="font-semibold">{m.type} Mock</p>
                      <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()} • {m.duration} mins</p>
                    </div>
                    <div className="font-bold text-lg">{m.score}%</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
               <Link href="/preparation/mock-tests">
                 <Button variant="outline" className="w-full">Take a Mock Test</Button>
               </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs Attention (Review)</CardTitle>
            <CardDescription>Questions and topics you got wrong recently.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="flex justify-between p-3 border rounded-lg bg-destructive/5 text-destructive">
                 <span className="font-medium">Failed DSA Problems</span>
                 <span className="font-bold">{dsaAttempts.filter(a => !a.solved).length}</span>
               </div>
               <div className="flex justify-between p-3 border rounded-lg bg-destructive/5 text-destructive">
                 <span className="font-medium">Incorrect Aptitude MCQs</span>
                 <span className="font-bold">{aptitudeAttempts.filter(a => !a.isCorrect).length}</span>
               </div>
               <div className="flex justify-between p-3 border rounded-lg bg-destructive/5 text-destructive">
                 <span className="font-medium">Incorrect Technical MCQs</span>
                 <span className="font-bold">{technicalAttempts.filter(a => !a.isCorrect).length}</span>
               </div>
               <Link href="/preparation/review">
                 <Button className="w-full mt-2" variant="secondary">Review All Mistakes</Button>
               </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, className, variant }: any) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}
