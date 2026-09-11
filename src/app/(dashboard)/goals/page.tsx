"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Goal, GoalCategory, GoalPriority, GoalStatus } from '@/domain/goals/types/goal.types';
import { goalService } from '@/services/GoalService';
import { calculateGoalProgress } from '@/domain/goals/GoalProgressEngine';
import { calculateCGPA } from '@/utils/academicCalculations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit2, Trash2, Calendar, Target, Activity } from 'lucide-react';

const CATEGORIES: GoalCategory[] = ['Academic', 'Attendance', 'Backlog', 'Career', 'Skills', 'DSA', 'Aptitude', 'Projects', 'Resume', 'Applications', 'Interview', 'Placement', 'Other'];

export default function GoalsPage() {
  const goals = useLiveQuery(() => db.goals.toArray()) || [];
  
  // Real-time Academic Data for Auto-Goals
  const semesters = useLiveQuery(() => db.semesters.toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const backlogs = useLiveQuery(() => db.backlogs.toArray()) || [];

  const currentCgpa = calculateCGPA(semesters).cgpa;
  const activeBacklogs = backlogs.filter(b => b.status === 'Active').length;
  
  let totalCond = 0, totalAtt = 0;
  subjects.forEach(s => {
    if (s.attendance && s.attendance.conducted > 0) {
      totalCond += s.attendance.conducted;
      totalAtt += s.attendance.attended;
    }
  });
  const currentAttendance = totalCond > 0 ? (totalAtt / totalCond) * 100 : 0;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Goal>>({});

  const handleAdd = () => {
    setFormData({
      id: crypto.randomUUID(),
      title: '',
      category: 'Academic',
      status: 'Not Started',
      priority: 'Medium',
      isAutomatic: false,
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (goal: Goal) => {
    setFormData(goal);
    setEditingId(goal.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      await goalService.deleteGoal(id);
    }
  };

  const handleSave = async () => {
    if (formData.id && formData.title && formData.category && formData.status && formData.priority) {
      await goalService.saveGoal(formData as Goal);
      setIsAdding(false);
      setEditingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-success/10 text-success';
      case 'Overdue': return 'bg-destructive/10 text-destructive';
      case 'In Progress': return 'bg-primary/10 text-primary';
      case 'Paused': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Goals & Targets</h1>
          <p className="text-sm md:text-base text-muted-foreground">Set manual targets or automatically track academic milestones.</p>
        </div>
        <Button onClick={handleAdd} disabled={isAdding}><Plus className="h-4 w-4 mr-2" /> New Goal</Button>
      </div>

      <div className="kpi-grid">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Goals</p><p className="text-2xl font-bold">{goals.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">In Progress</p><p className="text-2xl font-bold text-primary">{goals.filter(g => g.status === 'In Progress').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold text-success">{goals.filter(g => g.status === 'Completed').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">High Priority</p><p className="text-2xl font-bold text-destructive">{goals.filter(g => g.priority === 'High' && g.status !== 'Completed').length}</p></CardContent></Card>
      </div>

      {isAdding && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader><CardTitle>{editingId ? 'Edit Goal' : 'New Goal'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label>Title *</Label>
                <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Maintain 8.5 CGPA" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v: any) => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v: any) => setFormData({...formData, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline (Optional)</Label>
                <Input type="date" value={formData.deadline || ''} onChange={e => setFormData({...formData, deadline: e.target.value})} />
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2 mt-2 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Checkbox id="isAuto" checked={formData.isAutomatic || false} onCheckedChange={(checked) => setFormData({...formData, isAutomatic: checked === true})} />
                  <Label htmlFor="isAuto" className="font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Automatically track progress via App Data</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">If checked, progress will be calculated live based on your Academic Center data.</p>
              </div>

              {formData.isAutomatic ? (
                <>
                  <div className="space-y-2">
                    <Label>Automatic Metric</Label>
                    <Select value={formData.metricId || ''} onValueChange={v => setFormData({...formData, metricId: v})}>
                      <SelectTrigger><SelectValue placeholder="Select Metric" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cgpa">Target CGPA</SelectItem>
                        <SelectItem value="attendance">Overall Attendance %</SelectItem>
                        <SelectItem value="active-backlogs">Active Backlogs Target</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Value</Label>
                    <Input type="number" step="0.01" value={formData.target || ''} onChange={e => setFormData({...formData, target: parseFloat(e.target.value)})} placeholder="e.g. 8.5" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Target Value (Number)</Label>
                    <Input type="number" value={formData.target || ''} onChange={e => setFormData({...formData, target: parseFloat(e.target.value)})} placeholder="e.g. 100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Value</Label>
                    <Input type="number" value={formData.currentValue || ''} onChange={e => setFormData({...formData, currentValue: parseFloat(e.target.value)})} placeholder="e.g. 50" />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formData.title}>Save Goal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {goals.map(goal => {
          const { percentage, currentValue } = calculateGoalProgress({
            goal,
            currentCgpa,
            currentAttendance,
            activeBacklogs
          });

          return (
            <Card key={goal.id} className="relative group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="pr-12">
                    <div className="flex gap-2 items-center mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(goal.status)}`}>{goal.status}</span>
                      {goal.priority === 'High' && <span className="text-xs text-destructive font-medium border border-destructive/20 bg-destructive/10 px-2 py-0.5 rounded">High Priority</span>}
                    </div>
                    <h3 className="text-lg font-semibold">{goal.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {goal.category}</span>
                      {goal.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due {new Date(goal.deadline).toLocaleDateString()}</span>}
                      {goal.isAutomatic && <span className="flex items-center gap-1 text-primary"><Activity className="h-3 w-3" /> Auto</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {currentValue} / {goal.target || '?'}</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className={`h-2 ${percentage === 100 ? 'bg-success' : ''}`} />
                </div>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-md rounded-md p-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(goal)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(goal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {goals.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-card/50">
            No goals set yet. Click "New Goal" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
