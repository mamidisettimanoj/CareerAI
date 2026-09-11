"use client";

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { DailyTask } from '@/domain/daily/types/daily.types';
import { goalService } from '@/services/GoalService';
import { generateStudentPriorities } from '@/domain/daily/StudentPriorityEngine';
import { calculateStreakUpdate } from '@/domain/daily/StreakEngine';
import { calculateProfileCompleteness } from '@/domain/profile/ProfileCompletenessEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Flame, AlertTriangle, Calendar as CalendarIcon, CheckCircle2, Plus, Clock, Target, Trash2 } from 'lucide-react';
import { calculateAttendance } from '@/utils/academicCalculations';
import Link from 'next/link';

export default function TodayPage() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const goals = useLiveQuery(() => db.goals.toArray()) || [];
  const tasks = useLiveQuery(() => db.dailyTasks.toArray()) || [];
  const streak = useLiveQuery(() => db.streaks.get('global')) || null;
  const backlogs = useLiveQuery(() => db.backlogs.toArray()) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray()) || [];
  const interviews = useLiveQuery(() => db.interviews.toArray()) || [];
  const applications = useLiveQuery(() => db.applications.toArray()) || [];
  const certifications = useLiveQuery(() => db.certifications.toArray()) || [];

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<string>('Study');
  const [newTaskPriority, setNewTaskPriority] = useState<string>('Medium');

  const todayIso = new Date().toISOString().split('T')[0];

  const priorities = useMemo(() => {
    let attendanceDangerCount = 0;
    subjects.forEach(s => {
      if (s.attendance && s.attendance.conducted > 0) {
        const metrics = calculateAttendance(s.attendance.conducted, s.attendance.attended, s.attendance.target);
        if (metrics.status === 'DANGER') attendanceDangerCount++;
      }
    });

    return generateStudentPriorities({
      profileCompleteness: calculateProfileCompleteness(profile || null).percentage,
      activeBacklogs: backlogs.filter(b => b.status === 'Active').length,
      attendanceDangerCount,
      goals,
      tasks,
      interviews: interviews || [],
      applications: applications || [],
      certifications: certifications || []
    });
  }, [profile, goals, tasks, backlogs, subjects, interviews, applications, certifications]);

  const handleAddTask = async () => {
    if (!newTaskTitle) return;
    const task: DailyTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      category: newTaskCategory as any,
      priority: newTaskPriority as any,
      dueDate: todayIso,
      completed: false,
      createdAt: new Date().toISOString()
    };
    await goalService.saveDailyTask(task);
    setNewTaskTitle('');
  };

  const toggleTaskCompletion = async (task: DailyTask) => {
    const updatedTask = { ...task, completed: !task.completed };
    await goalService.saveDailyTask(updatedTask);

    if (updatedTask.completed) {
      // Trigger streak update
      const newStreak = calculateStreakUpdate(streak, new Date().toISOString());
      await goalService.saveStreak(newStreak);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await goalService.deleteDailyTask(id);
  };

  const todayTasks = tasks.filter(t => t.dueDate === todayIso);
  const completedToday = todayTasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Daily Command Center</h1>
          <p className="text-sm md:text-base text-muted-foreground">Your focus for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        {streak && (
          <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full font-bold">
            <Flame className="h-5 w-5" />
            {streak.currentStreak} Day Streak
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Priority Engine & Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="pb-2 bg-primary/5 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" aria-hidden="true" /> Priority Engine
              </CardTitle>
              <CardDescription>Auto-generated action items based on deadlines and academic risks.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {priorities.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-50" />
                  All caught up! No urgent priorities.
                </div>
              ) : (
                priorities.map(p => (
                  <div key={p.id} className={`p-3 rounded-lg border text-sm ${
                    p.priority === 'HIGH' ? 'bg-destructive/10 border-destructive/20 text-destructive-foreground' :
                    p.priority === 'MEDIUM' ? 'bg-gold/10 border-gold/20 text-gold-foreground' :
                    'bg-muted border-border/50'
                  }`}>
                    <div className="flex items-start gap-2">
                      {p.priority === 'HIGH' ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" /> : <Clock className="h-4 w-4 shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="font-semibold leading-tight">{p.title}</p>
                        {p.actionHref && (
                          <Link href={p.actionHref} className="inline-block mt-2 text-xs font-medium underline opacity-80 hover:opacity-100">
                            {p.actionLabel || 'Action'} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Daily Tasks Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Daily Checklist</CardTitle>
                  <CardDescription>Track your immediate tasks and build your streak.</CardDescription>
                </div>
                <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {completedToday}/{todayTasks.length} Done
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              
              {/* Add Task Form */}
              <div className="flex gap-2">
                <Input 
                  value={newTaskTitle} 
                  onChange={e => setNewTaskTitle(e.target.value)} 
                  placeholder="What do you need to do today?" 
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
                <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                  <SelectTrigger className="w-[110px] hidden sm:flex"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="DSA">DSA</SelectItem>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddTask} disabled={!newTaskTitle}><Plus className="h-4 w-4" /></Button>
              </div>

              {/* Task List */}
              <div className="space-y-2 flex-1 pt-2">
                {todayTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-card/50">
                    Your day is empty. Add tasks to start building your streak!
                  </div>
                ) : (
                  todayTasks.sort((a, b) => Number(a.completed) - Number(b.completed)).map(task => (
                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${task.completed ? 'bg-muted/50 border-transparent opacity-70' : 'bg-card border-border shadow-sm'}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Checkbox 
                          id={`task-${task.id}`} 
                          checked={task.completed} 
                          onCheckedChange={() => toggleTaskCompletion(task)} 
                          className="h-5 w-5 rounded-full"
                        />
                        <div className="flex flex-col overflow-hidden">
                          <Label htmlFor={`task-${task.id}`} className={`text-base truncate cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </Label>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{task.category}</span>
                            {task.priority === 'High' && !task.completed && <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">High</span>}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
