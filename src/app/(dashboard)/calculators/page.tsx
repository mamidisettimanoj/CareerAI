"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Plus, Trash2, Calculator } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function Calculators() {
  // CGPA to Percentage State
  const [cgpa, setCgpa] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');
  const [formula, setFormula] = useState<string>('multiply95');
  const [customFactor, setCustomFactor] = useState<string>('9.5');

  // SGPA State
  const [subjects, setSubjects] = useState<{ id: number; credits: string; grade: string }[]>([
    { id: 1, credits: '3', grade: '10' },
    { id: 2, credits: '4', grade: '9' },
    { id: 3, credits: '3', grade: '8' },
  ]);
  const [sgpaResult, setSgpaResult] = useState<{ sgpa: number; totalCredits: number } | null>(null);

  // Attendance State
  const [conducted, setConducted] = useState<string>('');
  const [attended, setAttended] = useState<string>('');
  const [attendanceResult, setAttendanceResult] = useState<{
    percentage: number;
    canMiss: number;
    needToAttend: number;
    target: number;
  } | null>(null);
  const [targetAttendance, setTargetAttendance] = useState<string>('75');

  // CGPA <-> Percentage Logic
  const handleConvert = () => {
    const cgpaVal = parseFloat(cgpa);
    if (isNaN(cgpaVal)) return;
    let result = 0;
    if (formula === 'multiply95') result = cgpaVal * 9.5;
    else if (formula === 'multiply10') result = cgpaVal * 10;
    else if (formula === 'minus075') result = (cgpaVal - 0.75) * 10;
    else if (formula === 'custom') {
      const factor = parseFloat(customFactor);
      if (!isNaN(factor)) result = cgpaVal * factor;
    }
    setPercentage(Math.min(100, Math.max(0, result)).toFixed(2));
  };

  // SGPA Logic
  const calculateSGPA = () => {
    let totalCredits = 0;
    let totalGradePoints = 0;
    subjects.forEach(sub => {
      const c = parseFloat(sub.credits);
      const g = parseFloat(sub.grade);
      if (!isNaN(c) && !isNaN(g)) {
        totalCredits += c;
        totalGradePoints += (c * g);
      }
    });
    if (totalCredits > 0) {
      setSgpaResult({ sgpa: parseFloat((totalGradePoints / totalCredits).toFixed(2)), totalCredits });
    }
  };

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now(), credits: '3', grade: '9' }]);
  };

  const removeSubject = (id: number) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updateSubject = (id: number, field: 'credits' | 'grade', value: string) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Attendance Logic
  const calculateAttendance = () => {
    const c = parseInt(conducted);
    const a = parseInt(attended);
    const target = parseInt(targetAttendance);
    
    if (isNaN(c) || isNaN(a) || c <= 0 || a < 0 || a > c || isNaN(target)) return;

    const currentPercent = (a / c) * 100;
    
    // Can miss
    // (a) / (c + miss) = target/100 -> a * 100 = target * c + target * miss -> miss = (a*100 - target*c)/target
    let canMiss = 0;
    if (currentPercent >= target) {
      canMiss = Math.floor((a * 100 - target * c) / target);
    }
    
    // Need to attend
    // (a + need) / (c + need) = target/100 -> (a+need)*100 = target*(c+need) -> a*100 + need*100 = target*c + target*need
    // need*(100-target) = target*c - a*100
    let needToAttend = 0;
    if (currentPercent < target) {
      needToAttend = Math.ceil((target * c - a * 100) / (100 - target));
    }

    setAttendanceResult({
      percentage: parseFloat(currentPercent.toFixed(1)),
      canMiss: Math.max(0, canMiss),
      needToAttend: Math.max(0, needToAttend),
      target
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Academic Calculators</h1>
        <p className="text-sm md:text-base text-muted-foreground">Tools to help you convert grades, calculate averages, and track attendance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CGPA to Percentage Converter */}
        <Card className="glass-panel w-full">
          <CardHeader>
            <CardTitle>CGPA ↔ Percentage</CardTitle>
            <CardDescription>Convert your CGPA based on university rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>University Formula</Label>
              <Select value={formula} onValueChange={setFormula}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conversion rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiply95">Standard CBSE / AICTE (CGPA × 9.5)</SelectItem>
                  <SelectItem value="multiply10">10 Point Absolute (CGPA × 10)</SelectItem>
                  <SelectItem value="minus075">Mumbai University ((CGPA - 0.75) × 10)</SelectItem>
                  <SelectItem value="custom">Custom Multiplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formula === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Multiplier Factor</Label>
                <Input type="number" value={customFactor} onChange={(e) => setCustomFactor(e.target.value)} placeholder="E.g. 9.5" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <div className="space-y-2 w-full">
                <Label>CGPA (out of 10)</Label>
                <Input type="number" value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="E.g. 8.5" step="0.01" />
              </div>
              <div className="sm:pt-6 text-muted-foreground flex-shrink-0 rotate-90 sm:rotate-0">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div className="space-y-2 w-full">
                <Label>Percentage (%)</Label>
                <Input type="text" value={percentage} readOnly className="bg-accent/10 border-accent/20 font-bold text-accent" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleConvert} className="w-full">Calculate Percentage</Button>
          </CardFooter>
        </Card>

        {/* Attendance Calculator */}
        <Card className="glass-panel w-full flex flex-col">
          <CardHeader>
            <CardTitle>Attendance Calculator</CardTitle>
            <CardDescription>Track if you meet your university requirements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label>Classes Conducted</Label>
                <Input type="number" value={conducted} onChange={(e) => setConducted(e.target.value)} placeholder="E.g. 50" />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Classes Attended</Label>
                <Input type="number" value={attended} onChange={(e) => setAttended(e.target.value)} placeholder="E.g. 38" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Target Attendance (%)</Label>
              <Select value={targetAttendance} onValueChange={setTargetAttendance}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="75">75% (Standard)</SelectItem>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="85">85%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {attendanceResult && (
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Current Attendance:</span>
                  <span className={`text-xl font-bold ${attendanceResult.percentage >= attendanceResult.target ? 'text-success' : 'text-destructive'}`}>
                    {attendanceResult.percentage}%
                  </span>
                </div>
                <Progress value={attendanceResult.percentage} className="h-2" />
                
                {attendanceResult.percentage >= attendanceResult.target ? (
                  <div className="bg-success/10 text-success p-3 rounded text-sm font-medium text-center">
                    You can safely miss the next {attendanceResult.canMiss} classes.
                  </div>
                ) : (
                  <div className="bg-destructive/10 text-destructive p-3 rounded text-sm font-medium text-center">
                    You must attend the next {attendanceResult.needToAttend} classes to reach {attendanceResult.target}%.
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={calculateAttendance} className="w-full">Calculate Attendance</Button>
          </CardFooter>
        </Card>

        {/* SGPA Calculator */}
        <Card className="glass-panel lg:col-span-2 w-full">
          <CardHeader>
            <CardTitle>SGPA Calculator</CardTitle>
            <CardDescription>Calculate your Semester Grade Point Average.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground uppercase px-2">
              <div className="col-span-5">Subject (Optional)</div>
              <div className="col-span-3">Credits</div>
              <div className="col-span-3">Grade Point (1-10)</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="space-y-3">
              {subjects.map((sub, index) => (
                <div key={sub.id} className="grid grid-cols-12 gap-2 sm:gap-4 items-center bg-card/50 p-2 sm:p-0 sm:bg-transparent rounded border sm:border-0 border-border/50">
                  <div className="col-span-12 sm:col-span-5 mb-1 sm:mb-0">
                    <Label className="sm:hidden text-xs text-muted-foreground">Subject</Label>
                    <Input placeholder={`Subject ${index + 1}`} />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Label className="sm:hidden text-xs text-muted-foreground">Credits</Label>
                    <Input type="number" value={sub.credits} onChange={(e) => updateSubject(sub.id, 'credits', e.target.value)} />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Label className="sm:hidden text-xs text-muted-foreground">Grade</Label>
                    <Input type="number" value={sub.grade} onChange={(e) => updateSubject(sub.id, 'grade', e.target.value)} max="10" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end sm:justify-center mt-4 sm:mt-0">
                    <Button variant="ghost" size="icon" onClick={() => removeSubject(sub.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addSubject} className="mt-2 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>

            {sgpaResult && (
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Credits: {sgpaResult.totalCredits}</div>
                  <div className="text-2xl font-bold text-primary">SGPA: {sgpaResult.sgpa}</div>
                </div>
                <Button variant="secondary" className="w-full sm:w-auto">
                  <Calculator className="mr-2 h-4 w-4" /> Save to Profile
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Button onClick={calculateSGPA} className="w-full sm:w-auto ml-auto">Calculate SGPA</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
