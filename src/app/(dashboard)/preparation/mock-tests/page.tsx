"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { MockTestAttempt } from '@/domain/preparation/types/preparation.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, PlayCircle, BarChart3 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function MockTestsCenter() {
  const mocks = useLiveQuery(() => db.mockTests.toArray()) || [];
  
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [testType, setTestType] = useState<'DSA' | 'APTITUDE' | 'TECHNICAL' | 'MIXED'>('MIXED');
  
  const handleStartTest = (type: 'DSA' | 'APTITUDE' | 'TECHNICAL' | 'MIXED') => {
    setTestType(type);
    setIsTakingTest(true);
  };

  const handleFinishTest = async () => {
    // Generate a random score between 40 and 100 for simulation purposes
    const score = Math.floor(Math.random() * 61) + 40;
    
    const attempt: MockTestAttempt = {
      id: uuidv4(),
      type: testType,
      score,
      duration: 60, // Mocked to 60 mins
      date: new Date().toISOString()
    };
    
    await db.mockTests.put(attempt);
    setIsTakingTest(false);
    alert(`Mock test completed! You scored ${score}%.`);
  };

  const recentMocks = mocks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const avgScore = mocks.length > 0 ? (mocks.reduce((acc, m) => acc + m.score, 0) / mocks.length).toFixed(1) : 0;

  if (isTakingTest) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-8">
        <h2 className="text-3xl font-bold">Taking {testType} Mock Test...</h2>
        <div className="flex justify-center">
          <Clock className="h-24 w-24 text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground">In a real scenario, this would load the timed testing interface.</p>
        <Button size="lg" onClick={handleFinishTest}>Finish & Submit Test</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Mock Tests
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Simulate real placement exams under timed conditions.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold border border-primary/20">
          Average Score: {avgScore}%
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Available Tests */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-xl">Available Mock Exams</h3>
          
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Mixed Placement Mock</CardTitle>
                  <CardDescription>Full simulation including Aptitude, Tech MCQs, and Basic Coding.</CardDescription>
                </div>
                <div className="text-sm font-semibold bg-muted px-2 py-1 rounded">60 Mins</div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleStartTest('MIXED')} className="w-full sm:w-auto"><PlayCircle className="mr-2 h-4 w-4" /> Start Simulation</Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">TCS NQT Aptitude Pattern</CardTitle>
                  <CardDescription>Strictly quantitative, logical reasoning, and verbal.</CardDescription>
                </div>
                <div className="text-sm font-semibold bg-muted px-2 py-1 rounded">45 Mins</div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleStartTest('APTITUDE')} className="w-full sm:w-auto"><PlayCircle className="mr-2 h-4 w-4" /> Start Simulation</Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Core CS Fundamentals</CardTitle>
                  <CardDescription>OS, DBMS, OOPs, and Computer Networks heavy.</CardDescription>
                </div>
                <div className="text-sm font-semibold bg-muted px-2 py-1 rounded">30 Mins</div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleStartTest('TECHNICAL')} className="w-full sm:w-auto"><PlayCircle className="mr-2 h-4 w-4" /> Start Simulation</Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Product-based DSA Mock</CardTitle>
                  <CardDescription>3 Medium-Hard coding problems.</CardDescription>
                </div>
                <div className="text-sm font-semibold bg-muted px-2 py-1 rounded">90 Mins</div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleStartTest('DSA')} className="w-full sm:w-auto"><PlayCircle className="mr-2 h-4 w-4" /> Start Simulation</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Analytics */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Past Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {recentMocks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No mock tests taken yet.</p>
              ) : (
                <ul className="space-y-4">
                  {recentMocks.map(m => (
                    <li key={m.id} className="flex flex-col gap-1 pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{m.type} Mock</span>
                        <span className={`font-bold text-sm ${m.score >= 70 ? 'text-success' : m.score >= 50 ? 'text-gold' : 'text-destructive'}`}>
                          {m.score}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{new Date(m.date).toLocaleDateString()}</span>
                        <span>{m.duration} mins</span>
                      </div>
                      {/* Simple progress bar representation */}
                      <div className="w-full bg-muted rounded-full h-1 mt-1">
                        <div className={`h-1 rounded-full ${m.score >= 70 ? 'bg-success' : m.score >= 50 ? 'bg-gold' : 'bg-destructive'}`} style={{ width: `${m.score}%` }}></div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
