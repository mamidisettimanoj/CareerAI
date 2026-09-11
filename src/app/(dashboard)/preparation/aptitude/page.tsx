"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { APTITUDE_QUESTIONS } from '@/data/questions/aptitude';
import { McqAttempt } from '@/domain/preparation/types/preparation.types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle2, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function AptitudeCenter() {
  const attempts = useLiveQuery(() => db.aptitudeAttempts.toArray()) || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = APTITUDE_QUESTIONS[currentIndex];

  const handleSelect = (option: string) => {
    if (showExplanation) return; // Prevent changing after submission
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!selectedOption) return;
    
    const isCorrect = selectedOption === question.correctAnswer;
    
    const attempt: McqAttempt = {
      id: uuidv4(),
      questionId: question.id,
      module: 'APTITUDE',
      topic: question.topic,
      difficulty: question.difficulty,
      isCorrect,
      timeSpent: 45, // Mocked 
      date: new Date().toISOString()
    };
    
    await db.aptitudeAttempts.put(attempt);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (currentIndex < APTITUDE_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Loop for demo
    }
  };

  const totalAttempted = attempts.length;
  const totalCorrect = attempts.filter(a => a.isCorrect).length;
  const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-success" /> Aptitude Practice
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Master quantitative and logical reasoning for placements.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{accuracy.toFixed(0)}%</div>
          <div className="text-sm text-muted-foreground">Accuracy ({totalCorrect}/{totalAttempted})</div>
        </div>
      </div>

      <Card className="border-2">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{question.topic}</span>
            <span className={`text-xs px-2 py-1 rounded border font-medium ${
              question.difficulty === 'Easy' ? 'text-success border-success/30 bg-success/10' :
              question.difficulty === 'Medium' ? 'text-gold-foreground border-gold/30 bg-gold/10' :
              'text-destructive border-destructive/30 bg-destructive/10'
            }`}>{question.difficulty}</span>
          </div>
          <CardTitle className="text-xl leading-relaxed">{question.question}</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-3">
          {question.options?.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrectAnswer = opt === question.correctAnswer;
            
            let btnClass = "w-full justify-start text-left h-auto py-3 px-4 border-2 ";
            
            if (!showExplanation) {
              btnClass += isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50 bg-background";
            } else {
              if (isCorrectAnswer) {
                btnClass += "border-success bg-success/10 text-success-foreground";
              } else if (isSelected && !isCorrectAnswer) {
                btnClass += "border-destructive bg-destructive/10 text-destructive-foreground";
              } else {
                btnClass += "border-muted opacity-50";
              }
            }

            return (
              <Button 
                key={idx} 
                variant="outline" 
                className={btnClass}
                onClick={() => handleSelect(opt)}
                disabled={showExplanation}
              >
                <span className="mr-3 font-bold opacity-50">{String.fromCharCode(65 + idx)}.</span>
                <span className="whitespace-normal">{opt}</span>
                {showExplanation && isCorrectAnswer && <CheckCircle2 className="ml-auto h-5 w-5 text-success" />}
                {showExplanation && isSelected && !isCorrectAnswer && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
              </Button>
            );
          })}

          {showExplanation && (
            <div className={`mt-6 p-4 rounded-lg border ${selectedOption === question.correctAnswer ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
              <h4 className="font-bold flex items-center gap-2 mb-2">
                {selectedOption === question.correctAnswer ? 
                  <><CheckCircle2 className="h-5 w-5 text-success" /> Correct!</> : 
                  <><XCircle className="h-5 w-5 text-destructive" /> Incorrect</>
                }
              </h4>
              <p className="text-sm">{question.explanation}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-muted/20 border-t py-4 flex justify-between">
          <div className="text-sm text-muted-foreground">Question {currentIndex + 1} of {APTITUDE_QUESTIONS.length}</div>
          {!showExplanation ? (
            <Button onClick={handleSubmit} disabled={!selectedOption}>Submit Answer</Button>
          ) : (
            <Button onClick={handleNext}>Next Question</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
