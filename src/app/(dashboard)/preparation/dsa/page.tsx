"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { DSA_PROBLEMS } from '@/data/questions/dsa';
import { DsaAttempt } from '@/domain/preparation/types/preparation.types';
import { calculateDsaTopicMastery } from '@/domain/preparation/engine/DsaTopicEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, XCircle, BarChart3, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function DsaCenter() {
  const attempts = useLiveQuery(() => db.dsaAttempts.toArray()) || [];
  
  const [filterTopic, setFilterTopic] = useState<string>('All');
  
  const topics = ['All', ...Array.from(new Set(DSA_PROBLEMS.map(p => p.topic)))];
  
  const handleMarkAttempt = async (problem: typeof DSA_PROBLEMS[0], solved: boolean) => {
    const attempt: DsaAttempt = {
      id: uuidv4(),
      problemId: problem.id,
      title: problem.title || '',
      topic: problem.topic,
      difficulty: problem.difficulty,
      solved,
      timeSpent: solved ? 15 : 30, // Mocked for now, normally would come from a timer dialog
      confidence: solved ? 80 : 20, // Mocked 
      date: new Date().toISOString()
    };
    await db.dsaAttempts.put(attempt);
  };

  const { topicScores, weakTopics } = calculateDsaTopicMastery(attempts);

  const getProblemStatus = (pid: string) => {
    const problemAttempts = attempts.filter(a => a.problemId === pid).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (problemAttempts.length === 0) return 'UNATTEMPTED';
    return problemAttempts[0].solved ? 'SOLVED' : 'FAILED';
  };

  const filteredProblems = filterTopic === 'All' ? DSA_PROBLEMS : DSA_PROBLEMS.filter(p => p.topic === filterTopic);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Data Structures & Algorithms</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track your problem-solving mastery and identify weak topics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Analytics & Weak Topics */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Topic Mastery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(topicScores).length === 0 ? (
                <p className="text-muted-foreground text-sm">Solve problems to generate mastery analytics.</p>
              ) : (
                Object.entries(topicScores).sort((a,b) => b[1] - a[1]).map(([topic, score]) => (
                  <div key={topic} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{topic}</span>
                      <span className="font-bold">{score}%</span>
                    </div>
                    <Progress value={score} className="h-1.5" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {weakTopics.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Weak Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {weakTopics.map((wt, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-bold block text-destructive">{wt.topic}</span>
                      <span className="text-muted-foreground">{wt.reason}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Problem List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {topics.map(t => (
              <Badge 
                key={t} 
                variant={filterTopic === t ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilterTopic(t)}
              >
                {t}
              </Badge>
            ))}
          </div>

          <div className="space-y-3">
            {filteredProblems.map(problem => {
              const status = getProblemStatus(problem.id);
              return (
                <Card key={problem.id} className="hover:shadow-md transition-shadow">
                  <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {status === 'SOLVED' && <CheckCircle2 className="h-5 w-5 text-success" />}
                        {status === 'FAILED' && <XCircle className="h-5 w-5 text-destructive" />}
                        {status === 'UNATTEMPTED' && <Circle className="h-5 w-5 text-muted-foreground" />}
                        
                        <h3 className="font-bold text-lg">{problem.title}</h3>
                        <Badge variant="outline" className={
                          problem.difficulty === 'Easy' ? 'border-success text-success' : 
                          problem.difficulty === 'Medium' ? 'border-gold text-gold-foreground' : 'border-destructive text-destructive'
                        }>{problem.difficulty}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{problem.description}</p>
                      <div className="text-xs font-medium text-muted-foreground bg-muted inline-block px-2 py-1 rounded">
                        Topic: {problem.topic}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Button size="sm" variant={status === 'SOLVED' ? 'outline' : 'default'} onClick={() => handleMarkAttempt(problem, true)}>
                        Mark Solved
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleMarkAttempt(problem, false)}>
                        Failed
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
