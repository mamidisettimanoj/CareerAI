"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { SemesterData } from '@/types';
import { academicService } from '@/services/AcademicService';

export default function SemestersPage() {
  const semesters = useLiveQuery(() => db.semesters.toArray())?.sort((a, b) => (a.semesterNumber || 0) - (b.semesterNumber || 0)) || [];
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SemesterData>>({});

  const handleAdd = () => {
    setFormData({
      id: crypto.randomUUID(),
      name: `Semester ${semesters.length + 1}`,
      semesterNumber: semesters.length + 1,
      academicYear: '2023-2024',
      sgpa: 0,
      credits: 0,
      status: 'Current'
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (semester: SemesterData) => {
    setFormData(semester);
    setEditingId(semester.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this semester? This will also delete all subjects and backlogs tied to it.")) {
      await academicService.deleteSemester(id);
    }
  };

  const handleSave = async () => {
    if (formData.id && formData.name) {
      await academicService.saveSemester(formData as SemesterData);
      setIsAdding(false);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Semester Management</h2>
          <p className="text-sm text-muted-foreground">Manage your academic terms and overall SGPA.</p>
        </div>
        <Button onClick={handleAdd} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" /> Add Semester
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Semester' : 'New Semester'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Semester Name</Label>
                <Input 
                  value={formData.name || ''} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Semester 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Semester Number</Label>
                <Input 
                  type="number"
                  value={formData.semesterNumber || ''} 
                  onChange={e => setFormData({ ...formData, semesterNumber: parseInt(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input 
                  value={formData.academicYear || ''} 
                  onChange={e => setFormData({ ...formData, academicYear: e.target.value })} 
                  placeholder="e.g. 2023-2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status || 'Completed'} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Current">Current</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total Credits (if known)</Label>
                <Input 
                  type="number"
                  min="0"
                  value={formData.credits || 0} 
                  onChange={e => setFormData({ ...formData, credits: parseFloat(e.target.value) })} 
                />
              </div>
              <div className="space-y-2">
                <Label>SGPA (if known)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.sgpa || 0} 
                  onChange={e => setFormData({ ...formData, sgpa: parseFloat(e.target.value) })} 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Semester</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {semesters.map(semester => (
          <Card key={semester.id} className="relative group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{semester.name}</CardTitle>
                  <CardDescription>{semester.academicYear || `Term ${semester.semesterNumber}`}</CardDescription>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${semester.status === 'Current' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {semester.status || 'Completed'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="font-semibold">{semester.credits}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">SGPA</p>
                  <p className="text-2xl font-bold text-primary">{semester.sgpa.toFixed(2)}</p>
                </div>
              </div>

              {/* Action Buttons overlay on hover */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-md rounded-md p-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(semester)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(semester.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {semesters.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
            No semesters added yet. Click "Add Semester" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
