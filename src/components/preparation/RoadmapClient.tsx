'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { updatePreparationTaskStatusAction, generatePreparationPlanAction } from '@/actions/preparation';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { RoadmapDef, PreparationTaskDef, PlanningHorizon } from '@/domain/preparation/types/preparation.types';

export function RoadmapClient({ roadmap }: { roadmap: RoadmapDef | null }) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generatePreparationPlanAction();
      toast({ title: 'Roadmap generated successfully' });
    } catch (e: any) {
      toast({ title: 'Failed to generate roadmap', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (!roadmap || roadmap.tasks.length === 0) {
    return (
      <Card className="text-center p-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="mb-2">No Active Roadmap</CardTitle>
        <CardDescription className="mb-6">
          Generate an adaptive preparation roadmap based on your latest intelligence data.
        </CardDescription>
        <Button onClick={handleGenerate} disabled={generating} size="lg">
          {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : 'Generate Roadmap'}
        </Button>
      </Card>
    );
  }

  const tasks = roadmap.tasks;
  const completedEffort = tasks.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalEffort = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const progressPercent = totalEffort > 0 ? (completedEffort / totalEffort) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            Adaptive Roadmap v{roadmap.version}
          </h2>
          <p className="text-muted-foreground text-sm">
            Target Role: <span className="font-medium text-foreground">{roadmap.targetRole || 'General Engineering'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <div className="flex justify-between text-xs mb-1">
              <span>Overall Progress</span>
              <span className="font-bold">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <Button variant="outline" onClick={handleGenerate} disabled={generating}>
            {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 7 / 30 / 90 Horizons */}
      <Tabs defaultValue="7" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6 bg-card border border-border/50">
          <TabsTrigger value="7">7 Days (Immediate)</TabsTrigger>
          <TabsTrigger value="30">30 Days (Core)</TabsTrigger>
          <TabsTrigger value="90">90 Days (Depth)</TabsTrigger>
        </TabsList>
        
        {(['7', '30', '90'] as const).map(horizonStr => {
          const horizon = parseInt(horizonStr) as PlanningHorizon;
          const horizonTasks = tasks.filter(t => t.horizon === horizon);
          
          return (
            <TabsContent key={horizonStr} value={horizonStr} className="space-y-4">
              {horizonTasks.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                  No tasks allocated for this horizon.
                </div>
              ) : (
                horizonTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function TaskCard({ task }: { task: PreparationTaskDef }) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setUpdating(true);
    const newStatus = checked ? 'COMPLETED' : 'TODO';
    try {
      await updatePreparationTaskStatusAction(task.id, newStatus);
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const priorityColor = {
    HIGH: 'border-destructive text-destructive',
    MEDIUM: 'border-gold text-gold',
    LOW: 'border-muted-foreground text-muted-foreground'
  }[task.priority];

  return (
    <Card className={`transition-all ${task.status === 'COMPLETED' ? 'opacity-60 bg-muted/20' : ''}`}>
      <CardContent className="p-4 flex gap-4">
        <div className="pt-1">
          <Checkbox 
            checked={task.status === 'COMPLETED'} 
            onCheckedChange={handleToggle}
            disabled={updating}
            className="h-5 w-5"
          />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h3>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${priorityColor}`}>
              {task.priority}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {Math.round(task.estimatedMinutes / 60 * 10) / 10} hrs
            </span>
            <span className="uppercase tracking-wider font-semibold opacity-70">
              {task.type.replace('_', ' ')}
            </span>
          </div>

          {task.justification && (
            <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/10 flex items-start gap-2 text-xs">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">{task.justification}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
