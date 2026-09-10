"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Plus, Edit2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SubjectData } from '@/types';
import { academicService } from '@/services/AcademicService';
import { calculateAttendance } from '@/utils/academicCalculations';

export default function AttendancePage() {
  const semesters = useLiveQuery(() => db.semesters.toArray())?.sort((a, b) => (b.semesterNumber || 0) - (a.semesterNumber || 0)) || [];
  const allSubjects = useLiveQuery(() => db.subjects.toArray()) || [];
  
  // Default to the most recent semester
  const defaultSemesterId = semesters.length > 0 ? semesters[0].id : '';
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');

  const activeSemesterId = selectedSemesterId || defaultSemesterId;

  const subjects = allSubjects.filter(s => s.semesterId === activeSemesterId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ conducted: number; attended: number; target: number }>({ conducted: 0, attended: 0, target: 75 });

  const handleEdit = (subject: SubjectData) => {
    setEditingId(subject.id);
    setAttendanceData({
      conducted: subject.attendance?.conducted || 0,
      attended: subject.attendance?.attended || 0,
      target: subject.attendance?.target || 75
    });
  };

  const handleSave = async (subject: SubjectData) => {
    const updatedSubject = {
      ...subject,
      attendance: attendanceData
    };
    await academicService.saveSubject(updatedSubject);
    setEditingId(null);
  };

  // Calculate aggregates
  let totalConducted = 0;
  let totalAttended = 0;
  let dangerCount = 0;
  let warningCount = 0;

  subjects.forEach(sub => {
    if (sub.attendance && sub.attendance.conducted > 0) {
      totalConducted += sub.attendance.conducted;
      totalAttended += sub.attendance.attended;
      const metrics = calculateAttendance(sub.attendance.conducted, sub.attendance.attended, sub.attendance.target);
      if (metrics.status === 'DANGER') dangerCount++;
      if (metrics.status === 'WARNING') warningCount++;
    }
  });

  const overallPercentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Attendance Tracker</h2>
          <p className="text-sm text-muted-foreground">Monitor classes and avoid detention.</p>
        </div>
        
        <div className="flex w-full md:w-[250px]">
          <Select value={activeSemesterId} onValueChange={setSelectedSemesterId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeSemesterId && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Overall Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <div className={`text-3xl font-bold ${overallPercentage >= 75 ? 'text-success' : 'text-destructive'}`}>
                  {totalConducted > 0 ? overallPercentage.toFixed(1) : '-'}%
                </div>
                <div className="text-sm text-muted-foreground text-right">
                  {totalAttended} / {totalConducted} Classes
                </div>
              </div>
              <Progress value={totalConducted > 0 ? overallPercentage : 0} className={`h-2 ${overallPercentage >= 75 ? 'bg-success' : 'bg-destructive'}`} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <div className="text-2xl font-bold text-destructive">{dangerCount}</div>
              <div className="text-xs text-muted-foreground">Subjects in Danger</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <AlertTriangle className="h-8 w-8 text-gold mb-2" />
              <div className="text-2xl font-bold text-gold">{warningCount}</div>
              <div className="text-xs text-muted-foreground">Subjects near limit</div>
            </CardContent>
          </Card>
        </div>
      )}

      {!activeSemesterId && (
        <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
          Please select or create a semester first.
        </div>
      )}

      {activeSemesterId && subjects.length === 0 && (
        <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
          No subjects found for this semester. Add subjects in the Subjects tab first.
        </div>
      )}

      {subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => {
            const hasData = subject.attendance && subject.attendance.conducted > 0;
            const metrics = hasData 
              ? calculateAttendance(subject.attendance!.conducted, subject.attendance!.attended, subject.attendance!.target)
              : null;
            
            const isEditing = editingId === subject.id;

            return (
              <Card key={subject.id} className={`border-l-4 ${metrics ? (metrics.status === 'SAFE' ? 'border-l-success' : metrics.status === 'WARNING' ? 'border-l-gold' : 'border-l-destructive') : 'border-l-muted'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base truncate pr-2">{subject.subjectName}</CardTitle>
                    {!isEditing && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleEdit(subject)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Conducted</Label>
                          <Input type="number" value={attendanceData.conducted} onChange={e => setAttendanceData({...attendanceData, conducted: parseInt(e.target.value) || 0})} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Attended</Label>
                          <Input type="number" value={attendanceData.attended} onChange={e => setAttendanceData({...attendanceData, attended: parseInt(e.target.value) || 0})} className="h-8" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Target %</Label>
                          <Input type="number" value={attendanceData.target} onChange={e => setAttendanceData({...attendanceData, target: parseInt(e.target.value) || 75})} className="h-8" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="w-full h-8" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button size="sm" className="w-full h-8" onClick={() => handleSave(subject)}>Save</Button>
                      </div>
                    </div>
                  ) : hasData && metrics ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-muted-foreground">{subject.attendance!.attended} / {subject.attendance!.conducted}</div>
                        <div className={`text-2xl font-bold ${metrics.status === 'SAFE' ? 'text-success' : metrics.status === 'WARNING' ? 'text-gold' : 'text-destructive'}`}>
                          {metrics.percentage}%
                        </div>
                      </div>
                      <Progress value={metrics.percentage} className={`h-1.5 ${metrics.status === 'SAFE' ? 'bg-success' : metrics.status === 'WARNING' ? 'bg-gold' : 'bg-destructive'}`} />
                      
                      <div className="pt-2 text-xs">
                        {metrics.status === 'SAFE' ? (
                          <span className="text-success flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Safe to miss {metrics.canMiss} classes.</span>
                        ) : (
                          <span className="text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Must attend {metrics.needToAttend} classes to reach {metrics.target}%.</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">No attendance tracked</p>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(subject)}>
                        <Plus className="h-3 w-3 mr-1" /> Track
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
