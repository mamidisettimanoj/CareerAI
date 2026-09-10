"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { BacklogData } from '@/types';
import { academicService } from '@/services/AcademicService';

export default function BacklogsPage() {
  const semesters = useLiveQuery(() => db.semesters.toArray())?.sort((a, b) => (b.semesterNumber || 0) - (a.semesterNumber || 0)) || [];
  const backlogs = useLiveQuery(() => db.backlogs.toArray()) || [];

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BacklogData>>({});

  const handleAdd = () => {
    setFormData({
      id: crypto.randomUUID(),
      subjectName: '',
      subjectCode: '',
      semesterId: semesters.length > 0 ? semesters[0].id : '',
      attempts: 1,
      status: 'Active'
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (backlog: BacklogData) => {
    setFormData(backlog);
    setEditingId(backlog.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this backlog record?")) {
      await academicService.deleteBacklog(id);
    }
  };

  const handleSave = async () => {
    if (formData.id && formData.subjectName && formData.semesterId) {
      await academicService.saveBacklog(formData as BacklogData);
      setIsAdding(false);
      setEditingId(null);
    }
  };

  const activeBacklogs = backlogs.filter(b => b.status === 'Active');
  const clearedBacklogs = backlogs.filter(b => b.status === 'Cleared');
  const attemptedBacklogs = backlogs.filter(b => b.status === 'Attempted');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Backlog Tracker</h2>
          <p className="text-sm text-muted-foreground">Manage active backlogs and plan your clearance strategy.</p>
        </div>
        <Button onClick={handleAdd} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" /> Add Backlog
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Backlogs</p>
              <h3 className="text-4xl font-bold text-destructive mt-1">{activeBacklogs.length}</h3>
            </div>
            <AlertOctagon className="h-10 w-10 text-destructive/50" />
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Cleared</p>
              <h3 className="text-4xl font-bold text-success mt-1">{clearedBacklogs.length}</h3>
            </div>
            <CheckCircle2 className="h-10 w-10 text-success/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total History</p>
              <h3 className="text-4xl font-bold mt-1">{backlogs.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdding && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Backlog' : 'New Backlog'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject Name *</Label>
                <Input 
                  value={formData.subjectName || ''} 
                  onChange={e => setFormData({ ...formData, subjectName: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Subject Code</Label>
                <Input 
                  value={formData.subjectCode || ''} 
                  onChange={e => setFormData({ ...formData, subjectCode: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Original Semester *</Label>
                <Select value={formData.semesterId || ''} onValueChange={(val: any) => setFormData({ ...formData, semesterId: val })}>
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
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status || 'Active'} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Attempted">Attempted (Awaiting Result)</SelectItem>
                    <SelectItem value="Cleared">Cleared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Attempts So Far</Label>
                <Input 
                  type="number"
                  value={formData.attempts || 1} 
                  onChange={e => setFormData({ ...formData, attempts: parseInt(e.target.value) || 1 })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Exam Date (Optional)</Label>
                <Input 
                  type="date"
                  value={formData.examDate || ''} 
                  onChange={e => setFormData({ ...formData, examDate: e.target.value })} 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formData.subjectName || !formData.semesterId}>Save Backlog</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Active Backlogs</h3>
        {activeBacklogs.length === 0 && !isAdding && (
          <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg bg-success/5">
            You have no active backlogs. Keep it up!
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeBacklogs.map(backlog => (
            <Card key={backlog.id} className="border-l-4 border-l-destructive">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{backlog.subjectName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {backlog.subjectCode && <span className="text-xs bg-muted px-2 py-0.5 rounded">{backlog.subjectCode}</span>}
                      <span className="text-xs text-muted-foreground">Attempts: {backlog.attempts}</span>
                      <span className="text-xs text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded">ACTIVE</span>
                    </div>
                    {backlog.examDate && (
                      <p className="text-sm mt-2 text-muted-foreground">Exam Date: {new Date(backlog.examDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(backlog)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(backlog.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {(clearedBacklogs.length > 0 || attemptedBacklogs.length > 0) && (
        <div className="space-y-4 pt-6 border-t border-border/50">
          <h3 className="text-lg font-medium">History</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...attemptedBacklogs, ...clearedBacklogs].map(backlog => (
              <Card key={backlog.id} className={`border-l-4 ${backlog.status === 'Cleared' ? 'border-l-success' : 'border-l-gold'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{backlog.subjectName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Attempts: {backlog.attempts}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${backlog.status === 'Cleared' ? 'bg-success/10 text-success' : 'bg-gold/10 text-gold'}`}>
                          {backlog.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(backlog)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(backlog.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
