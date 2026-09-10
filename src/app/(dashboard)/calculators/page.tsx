"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Plus, Trash2, Calculator, Target, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { calculateAttendance, calculateRequiredCGPA, calculateCGPA } from '@/utils/academicCalculations';

export default function Calculators() {
  const storedSemesters = useLiveQuery(() => db.semesters.toArray()) || [];

  // CGPA to Percentage State
  const [cgpa, setCgpa] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');
  const [formula, setFormula] = useState<string>('multiply95');
  const [customFactor, setCustomFactor] = useState<string>('9.5');

  // Attendance State
  const [conducted, setConducted] = useState<string>('');
  const [attended, setAttended] = useState<string>('');
  const [attendanceResult, setAttendanceResult] = useState<any>(null);
  const [targetAttendance, setTargetAttendance] = useState<string>('75');

  // SGPA State (Standalone)
  const [subjects, setSubjects] = useState<{ id: number; credits: string; grade: string }[]>([
    { id: 1, credits: '3', grade: '10' },
    { id: 2, credits: '4', grade: '9' },
    { id: 3, credits: '3', grade: '8' },
  ]);
  const [sgpaResult, setSgpaResult] = useState<{ sgpa: number; totalCredits: number } | null>(null);

  // CGPA Planner State
  const [planCurrentCgpa, setPlanCurrentCgpa] = useState<string>('');
  const [planCompletedCredits, setPlanCompletedCredits] = useState<string>('');
  const [planRemainingCredits, setPlanRemainingCredits] = useState<string>('');
  const [planTargetCgpa, setPlanTargetCgpa] = useState<string>('');
  const [plannerResult, setPlannerResult] = useState<{ requiredAverage: number; isPossible: boolean } | null>(null);

  // What-If State
  const [whatIfSemesters, setWhatIfSemesters] = useState<{ id: string; name: string; sgpa: string; credits: string }[]>([]);
  const [whatIfResult, setWhatIfResult] = useState<{ cgpa: number } | null>(null);

  // Handlers
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

  const handleCalculateAttendance = () => {
    const c = parseInt(conducted);
    const a = parseInt(attended);
    const target = parseInt(targetAttendance);
    if (isNaN(c) || isNaN(a) || isNaN(target)) return;
    setAttendanceResult(calculateAttendance(c, a, target));
  };

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

  const calculatePlanner = () => {
    const current = parseFloat(planCurrentCgpa);
    const completed = parseFloat(planCompletedCredits);
    const remaining = parseFloat(planRemainingCredits);
    const target = parseFloat(planTargetCgpa);

    if (isNaN(current) || isNaN(completed) || isNaN(remaining) || isNaN(target)) return;

    setPlannerResult(calculateRequiredCGPA(current, completed, target, remaining));
  };

  const loadWhatIfFromDb = () => {
    setWhatIfSemesters(storedSemesters.map(s => ({
      id: s.id,
      name: s.name,
      sgpa: s.sgpa.toString(),
      credits: s.credits.toString()
    })));
    setWhatIfResult(null);
  };

  const calculateWhatIf = () => {
    let totalCredits = 0;
    let totalPoints = 0;
    whatIfSemesters.forEach(s => {
      const credits = parseFloat(s.credits);
      const sgpa = parseFloat(s.sgpa);
      if (!isNaN(credits) && !isNaN(sgpa) && credits > 0) {
        totalCredits += credits;
        totalPoints += (sgpa * credits);
      }
    });
    if (totalCredits > 0) {
      setWhatIfResult({ cgpa: parseFloat((totalPoints / totalCredits).toFixed(2)) });
    }
  };

  const addWhatIfSemester = () => {
    setWhatIfSemesters([...whatIfSemesters, { id: Date.now().toString(), name: `Future Semester`, sgpa: '8.0', credits: '20' }]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Academic Calculators</h1>
        <p className="text-sm md:text-base text-muted-foreground">Comprehensive toolset for planning your academic trajectory.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CGPA Planner */}
        <Card className="w-full lg:col-span-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> CGPA Target Planner</CardTitle>
            <CardDescription>Find out exactly what average you need in future semesters to reach your dream CGPA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Current CGPA</Label>
                <Input type="number" step="0.01" value={planCurrentCgpa} onChange={e => setPlanCurrentCgpa(e.target.value)} placeholder="e.g. 7.5" />
              </div>
              <div className="space-y-2">
                <Label>Completed Credits</Label>
                <Input type="number" value={planCompletedCredits} onChange={e => setPlanCompletedCredits(e.target.value)} placeholder="e.g. 80" />
              </div>
              <div className="space-y-2">
                <Label>Remaining Credits</Label>
                <Input type="number" value={planRemainingCredits} onChange={e => setPlanRemainingCredits(e.target.value)} placeholder="e.g. 40" />
              </div>
              <div className="space-y-2">
                <Label>Target CGPA</Label>
                <Input type="number" step="0.01" value={planTargetCgpa} onChange={e => setPlanTargetCgpa(e.target.value)} placeholder="e.g. 8.0" />
              </div>
            </div>

            {plannerResult && (
              <div className={`mt-4 p-4 rounded-lg border ${plannerResult.isPossible ? 'bg-success/10 border-success/20 text-success-foreground' : 'bg-destructive/10 border-destructive/20 text-destructive-foreground'}`}>
                {plannerResult.isPossible ? (
                  <div className="space-y-1">
                    <p className="font-semibold">Target is Achievable!</p>
                    <p className="text-sm">You need to maintain an average of <strong className="text-lg">{plannerResult.requiredAverage}</strong> across your remaining credits to hit {planTargetCgpa}.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-semibold">Target is Mathematically Impossible</p>
                    <p className="text-sm">Even if you score a perfect 10.0, you cannot reach {planTargetCgpa} with the remaining credits. (Required average: {plannerResult.requiredAverage})</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={calculatePlanner} className="w-full md:w-auto ml-auto">Calculate Target</Button>
          </CardFooter>
        </Card>

        {/* What-If CGPA Simulator */}
        <Card className="w-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-accent" /> What-If Simulator</CardTitle>
            <CardDescription>Simulate future semesters to see how your CGPA will change.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <Button variant="outline" size="sm" onClick={loadWhatIfFromDb}>
                Load Current Semesters
              </Button>
              <Button variant="outline" size="sm" onClick={addWhatIfSemester}>
                <Plus className="h-4 w-4 mr-2" /> Add Semester
              </Button>
            </div>

            <div className="space-y-3">
              {whatIfSemesters.map((s, idx) => (
                <div key={s.id} className="grid grid-cols-12 gap-2 sm:gap-4 items-center bg-card/50 p-2 sm:p-0 sm:bg-transparent rounded border sm:border-0 border-border/50">
                  <div className="col-span-12 sm:col-span-5">
                    <Input value={s.name} onChange={e => {
                      const newSems = [...whatIfSemesters];
                      newSems[idx].name = e.target.value;
                      setWhatIfSemesters(newSems);
                    }} placeholder="Semester Name" />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Label className="sm:hidden text-xs text-muted-foreground">Credits</Label>
                    <Input type="number" value={s.credits} onChange={e => {
                      const newSems = [...whatIfSemesters];
                      newSems[idx].credits = e.target.value;
                      setWhatIfSemesters(newSems);
                    }} placeholder="Credits" />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Label className="sm:hidden text-xs text-muted-foreground">SGPA</Label>
                    <Input type="number" step="0.01" value={s.sgpa} onChange={e => {
                      const newSems = [...whatIfSemesters];
                      newSems[idx].sgpa = e.target.value;
                      setWhatIfSemesters(newSems);
                    }} placeholder="SGPA" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => setWhatIfSemesters(whatIfSemesters.filter(w => w.id !== s.id))} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {whatIfSemesters.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                  Load your data or manually add semesters to simulate CGPA.
                </div>
              )}
            </div>

            {whatIfResult && (
              <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Simulated Final CGPA</p>
                <p className="text-4xl font-bold text-accent">{whatIfResult.cgpa}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={calculateWhatIf} className="w-full md:w-auto ml-auto" disabled={whatIfSemesters.length === 0}>Simulate CGPA</Button>
          </CardFooter>
        </Card>

        {/* Existing CGPA/Percentage */}
        <Card className="w-full">
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
            <div className="flex items-center gap-4 pt-2">
              <div className="space-y-2 w-full">
                <Label>CGPA (out of 10)</Label>
                <Input type="number" value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="E.g. 8.5" step="0.01" />
              </div>
              <div className="pt-6 text-muted-foreground"><ArrowRightLeft className="h-5 w-5" /></div>
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

        {/* Existing Attendance */}
        <Card className="w-full flex flex-col">
          <CardHeader>
            <CardTitle>Quick Attendance</CardTitle>
            <CardDescription>Calculate specific attendance scenarios quickly.</CardDescription>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <span className={`text-xl font-bold ${attendanceResult.status === 'SAFE' ? 'text-success' : 'text-destructive'}`}>
                    {attendanceResult.percentage}%
                  </span>
                </div>
                <Progress value={attendanceResult.percentage} className="h-2" />
                {attendanceResult.status === 'SAFE' ? (
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
            <Button onClick={handleCalculateAttendance} className="w-full">Calculate Attendance</Button>
          </CardFooter>
        </Card>

        {/* Existing SGPA */}
        <Card className="lg:col-span-2 w-full">
          <CardHeader>
            <CardTitle>Manual SGPA Calculator</CardTitle>
            <CardDescription>Calculate SGPA quickly without saving to your profile.</CardDescription>
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
                    <Input placeholder={`Subject ${index + 1}`} />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Input type="number" value={sub.credits} onChange={(e) => setSubjects(subjects.map(s => s.id === sub.id ? { ...s, credits: e.target.value } : s))} />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Input type="number" value={sub.grade} onChange={(e) => setSubjects(subjects.map(s => s.id === sub.id ? { ...s, grade: e.target.value } : s))} max="10" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setSubjects([...subjects, { id: Date.now(), credits: '3', grade: '9' }])} className="mt-2 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>
            {sgpaResult && (
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">Total Credits: {sgpaResult.totalCredits}</div>
                  <div className="text-2xl font-bold text-primary">SGPA: {sgpaResult.sgpa}</div>
                </div>
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
