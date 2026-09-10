"use client";

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SubjectData, SemesterData } from '@/types';
import { academicService } from '@/services/AcademicService';
import { calculateSGPA, getGradePoint } from '@/utils/academicCalculations';

export default function SubjectsPage() {
  const semesters = useLiveQuery(() => db.semesters.toArray())?.sort((a, b) => (a.semesterNumber || 0) - (b.semesterNumber || 0)) || [];
  const allSubjects = useLiveQuery(() => db.subjects.toArray()) || [];
  
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SubjectData>>({});

  const subjects = useMemo(() => {
    if (!selectedSemesterId) return [];
    return allSubjects.filter(s => s.semesterId === selectedSemesterId);
  }, [allSubjects, selectedSemesterId]);

  const selectedSemester = useMemo(() => {
    return semesters.find(s => s.id === selectedSemesterId) || null;
  }, [semesters, selectedSemesterId]);

  const { sgpa: calculatedSgpa, totalCredits } = calculateSGPA(subjects);

  const handleAdd = () => {
    if (!selectedSemesterId) return;
    setFormData({
      id: crypto.randomUUID(),
      semesterId: selectedSemesterId,
      subjectCode: '',
      subjectName: '',
      credits: 3,
      result: 'PENDING'
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (subject: SubjectData) => {
    setFormData(subject);
    setEditingId(subject.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      await academicService.deleteSubject(id);
    }
  };

  const handleSave = async () => {
    if (formData.id && formData.subjectName && formData.semesterId) {
      // Auto-calculate grade point if grade is provided but point is missing
      let gp = formData.gradePoint;
      if (formData.grade && (gp === undefined || gp === null)) {
        gp = getGradePoint(formData.grade) ?? undefined;
      }
      
      const subjectToSave = { ...formData, gradePoint: gp } as SubjectData;
      await academicService.saveSubject(subjectToSave);
      setIsAdding(false);
      setEditingId(null);
    }
  };

  const updateSemesterSgpa = async () => {
    if (selectedSemester) {
      await academicService.saveSemester({
        ...selectedSemester,
        sgpa: calculatedSgpa,
        credits: totalCredits
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Subject & Marks Management</h2>
          <p className="text-sm text-muted-foreground">Manage subjects, grades, and automatically calculate SGPA.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleAdd} disabled={!selectedSemesterId || isAdding}>
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
      </div>

      {!selectedSemesterId && (
        <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
          Please select a semester to manage subjects.
        </div>
      )}

      {selectedSemesterId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            {isAdding && (
              <Card className="border-primary/50 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{editingId ? 'Edit Subject' : 'New Subject'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subject Code (Optional)</Label>
                      <Input 
                        value={formData.subjectCode || ''} 
                        onChange={e => setFormData({ ...formData, subjectCode: e.target.value })} 
                        placeholder="e.g. CS101"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject Name *</Label>
                      <Input 
                        value={formData.subjectName || ''} 
                        onChange={e => setFormData({ ...formData, subjectName: e.target.value })} 
                        placeholder="e.g. Data Structures"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credits *</Label>
                      <Input 
                        type="number"
                        value={formData.credits || 0} 
                        onChange={e => setFormData({ ...formData, credits: parseFloat(e.target.value) })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Result Status</Label>
                      <Select value={formData.result || 'PENDING'} onValueChange={(val: any) => setFormData({ ...formData, result: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PASS">PASS</SelectItem>
                          <SelectItem value="FAIL">FAIL</SelectItem>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Grade (e.g. A, B+, 8)</Label>
                      <Input 
                        value={formData.grade || ''} 
                        onChange={e => setFormData({ ...formData, grade: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grade Point (Optional)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.gradePoint || ''} 
                        onChange={e => setFormData({ ...formData, gradePoint: e.target.value ? parseFloat(e.target.value) : undefined })} 
                        placeholder="Auto-calculated if blank"
                      />
                    </div>
                  </div>
                  
                  {/* Optional Marks fields can be hidden behind an accordion in a more advanced UI, keeping it simple here */}
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!formData.subjectName}>Save Subject</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {subjects.map(subject => (
                <Card key={subject.id} className="group">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{subject.subjectName}</h4>
                        {subject.subjectCode && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{subject.subjectCode}</span>}
                        {subject.result === 'FAIL' && <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded font-medium">FAIL</span>}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                        <span>Credits: {subject.credits}</span>
                        <span>Grade: {subject.grade || '-'} {subject.gradePoint ? `(${subject.gradePoint})` : ''}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(subject)} className="text-muted-foreground hover:text-primary">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {subjects.length === 0 && !isAdding && (
                <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card/50">
                  No subjects added for this semester.
                </div>
              )}
            </div>
          </div>

          {/* SGPA Summary Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" /> 
                  SGPA Summary
                </CardTitle>
                <CardDescription>Based on subjects entered</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Calculated SGPA</p>
                  <p className="text-4xl font-bold text-primary">{calculatedSgpa.toFixed(2)}</p>
                </div>
                <div className="flex justify-between border-t border-border pt-4">
                  <span className="text-muted-foreground">Total Credits</span>
                  <span className="font-medium">{totalCredits}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-4">
                  <span className="text-muted-foreground">Saved SGPA</span>
                  <span className="font-medium">{selectedSemester?.sgpa.toFixed(2) || '0.00'}</span>
                </div>
                
                {selectedSemester && (selectedSemester.sgpa !== calculatedSgpa || selectedSemester.credits !== totalCredits) && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <p className="text-xs text-gold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Mismatch with saved semester data.
                    </p>
                    <Button onClick={updateSemesterSgpa} className="w-full" variant="secondary">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Sync to Semester
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
