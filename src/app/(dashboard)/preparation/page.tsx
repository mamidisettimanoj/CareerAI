"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadData, saveData } from '@/lib/storage';
import { PrepTask, AppState } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ListTodo, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const categories = ['Aptitude', 'DSA', 'Programming', 'Core Subjects', 'Projects', 'Resume', 'Communication', 'Mock Interviews'];

export function Preparation() {
  const [data, setData] = useState<AppState | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCat, setNewTaskCat] = useState<string>('DSA');

  useEffect(() => {
    setData(loadData());
  }, []);

  if (!data) return null;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: PrepTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      category: newTaskCat as any,
      completed: false
    };

    const updatedTasks = [newTask, ...data.tasks];
    saveData({ tasks: updatedTasks });
    setData({ ...data, tasks: updatedTasks });
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    const updatedTasks = data.tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveData({ tasks: updatedTasks });
    setData({ ...data, tasks: updatedTasks });
  };

  const deleteTask = (id: string) => {
    const updatedTasks = data.tasks.filter(t => t.id !== id);
    saveData({ tasks: updatedTasks });
    setData({ ...data, tasks: updatedTasks });
  };

  const completedCount = data.tasks.filter(t => t.completed).length;
  const totalCount = data.tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold">Preparation Tracker</h1>
        <p className="text-muted-foreground">Manage your interview and coding preparation tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Progress Card */}
        <Card className="glass-panel md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>{completedCount} of {totalCount} tasks completed</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-8 border-muted mb-4">
              <div 
                className="absolute inset-0 rounded-full border-8 border-primary"
                style={{ clipPath: `polygon(0 0, 100% 0, 100% ${progress}%, 0 ${progress}%)`, transform: 'rotate(-90deg)' }}
              />
              <span className="text-3xl font-bold text-primary">{progress}%</span>
            </div>
            {progress === 100 && totalCount > 0 && (
              <div className="flex items-center text-success font-medium gap-1 text-sm mt-2">
                <CheckCircle className="h-4 w-4" /> All caught up!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Add New Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-2 flex-1">
                  <Label>Task Description</Label>
                  <Input 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)} 
                    placeholder="E.g. Solve 5 Array problems on LeetCode"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                </div>
                <div className="space-y-2 w-full sm:w-48">
                  <Label>Category</Label>
                  <Select value={newTaskCat} onValueChange={setNewTaskCat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddTask} className="w-full sm:w-auto bg-primary">Add Task</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-accent" /> Your Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-lg">
                  No preparation tasks added yet. Start planning!
                </div>
              ) : (
                <div className="space-y-2">
                  {data.tasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        task.completed ? 'bg-muted/30 border-transparent opacity-60' : 'bg-card/50 border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Checkbox 
                          checked={task.completed} 
                          onCheckedChange={() => toggleTask(task.id)}
                          id={`task-${task.id}`}
                        />
                        <div className="flex flex-col overflow-hidden">
                          <label 
                            htmlFor={`task-${task.id}`}
                            className={`text-sm font-medium leading-none cursor-pointer truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {task.title}
                          </label>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">
                            {task.category}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
