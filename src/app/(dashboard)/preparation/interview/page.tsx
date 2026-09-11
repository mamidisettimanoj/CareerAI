"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { INTERVIEW_QUESTIONS } from '@/data/questions/interview';
import { InterviewAnswer } from '@/domain/preparation/types/preparation.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle2, Star, MessageSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function InterviewCenter() {
  const answers = useLiveQuery(() => db.interviewAnswers.toArray()) || [];
  
  const [selectedQuestion, setSelectedQuestion] = useState<typeof INTERVIEW_QUESTIONS[0] | null>(null);
  
  const [formData, setFormData] = useState({
    situation: '',
    task: '',
    action: '',
    result: ''
  });

  const handleSelect = (q: typeof INTERVIEW_QUESTIONS[0]) => {
    setSelectedQuestion(q);
    const existing = answers.find(a => a.questionId === q.id);
    if (existing) {
      setFormData({
        situation: existing.situation,
        task: existing.task,
        action: existing.action,
        result: existing.result
      });
    } else {
      setFormData({ situation: '', task: '', action: '', result: '' });
    }
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (formData.situation.length > 20) score += 25;
    if (formData.task.length > 20) score += 25;
    if (formData.action.length > 50) score += 25; // Action should be detailed
    if (formData.result.length > 20) score += 25;
    return score;
  };

  const handleSave = async () => {
    if (!selectedQuestion) return;
    
    const existing = answers.find(a => a.questionId === selectedQuestion.id);
    
    const answer: InterviewAnswer = {
      id: existing ? existing.id : uuidv4(),
      questionId: selectedQuestion.id,
      category: selectedQuestion.topic,
      question: selectedQuestion.question || '',
      situation: formData.situation,
      task: formData.task,
      action: formData.action,
      result: formData.result,
      completeness: calculateCompleteness(),
      lastPracticed: new Date().toISOString()
    };
    
    await db.interviewAnswers.put(answer);
    alert('STAR answer saved successfully!');
    setSelectedQuestion(null);
  };

  const completenessScore = calculateCompleteness();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-placement" /> Interview Preparation
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Use the STAR method (Situation, Task, Action, Result) to build behavioral answers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Question List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-lg">Common Questions</h3>
          
          <div className="space-y-3">
            {INTERVIEW_QUESTIONS.map(q => {
              const existing = answers.find(a => a.questionId === q.id);
              const isSelected = selectedQuestion?.id === q.id;
              
              return (
                <Card 
                  key={q.id} 
                  className={`cursor-pointer transition-colors ${isSelected ? 'border-primary ring-1 ring-primary/50' : 'hover:border-primary/50'}`}
                  onClick={() => handleSelect(q)}
                >
                  <CardContent className="p-4 flex gap-3 items-start">
                    {existing ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold text-sm line-clamp-2">{q.question}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{q.topic}</span>
                        {existing && <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Ready</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Col: STAR Builder */}
        <div className="lg:col-span-2">
          {!selectedQuestion ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              <Star className="h-12 w-12 text-muted mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">STAR Answer Builder</h3>
              <p>Select a question from the list to start building your structured answer.</p>
            </div>
          ) : (
            <Card className="border-primary/20 shadow-sm">
              <CardHeader className="bg-muted/30 border-b">
                <CardDescription className="uppercase tracking-wider font-semibold text-primary">{selectedQuestion.topic} Question</CardDescription>
                <CardTitle className="text-xl leading-relaxed">{selectedQuestion.question}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <span className="text-sm font-semibold text-primary">Completeness</span>
                  <div className="flex items-center gap-3 w-1/2">
                    <Progress value={completenessScore} className="h-2 flex-1" />
                    <span className="text-xs font-bold w-8">{completenessScore}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-bold"><span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">S</span> Situation</Label>
                  <p className="text-xs text-muted-foreground">Set the scene and provide necessary details of your example.</p>
                  <Textarea 
                    value={formData.situation} 
                    onChange={e => setFormData({...formData, situation: e.target.value})} 
                    placeholder="e.g., In my final year project, our team had to deliver a web application within 6 weeks..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-bold"><span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">T</span> Task</Label>
                  <p className="text-xs text-muted-foreground">Describe what your specific responsibility was in that situation.</p>
                  <Textarea 
                    value={formData.task} 
                    onChange={e => setFormData({...formData, task: e.target.value})} 
                    placeholder="e.g., My role was to design the database schema and implement the authentication system..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-bold"><span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">A</span> Action</Label>
                  <p className="text-xs text-muted-foreground">Explain exactly what steps YOU took to address it. Use 'I', not 'We'.</p>
                  <Textarea 
                    value={formData.action} 
                    onChange={e => setFormData({...formData, action: e.target.value})} 
                    placeholder="e.g., I researched JWT authentication, created a secure Prisma schema, and wrote the API endpoints..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-bold"><span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">R</span> Result</Label>
                  <p className="text-xs text-muted-foreground">Share what outcomes your actions achieved. Use numbers if possible.</p>
                  <Textarea 
                    value={formData.result} 
                    onChange={e => setFormData({...formData, result: e.target.value})} 
                    placeholder="e.g., The system handled 500 concurrent logins securely, and we scored an A grade..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedQuestion(null)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={completenessScore === 0}>Save Answer</Button>
                </div>

              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
