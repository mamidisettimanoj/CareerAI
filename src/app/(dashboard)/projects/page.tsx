"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadData, saveData } from '@/lib/storage';
import { AppState, ProjectData } from '@/types';
import { Plus, Trash2, Github, ExternalLink, Code2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function Projects() {
  const [data, setData] = useState<AppState | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    const d = loadData();
    setData(d);
    setProjects(d.projects || []);
  }, []);

  const addProject = () => {
    const newProject: ProjectData = {
      id: Date.now().toString(),
      name: '',
      technology: '',
      description: '',
      difficulty: 'Medium',
      githubUrl: '',
      liveUrl: ''
    };
    setProjects([...projects, newProject]);
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const updateProject = (id: string, field: keyof ProjectData, value: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const saveProjects = () => {
    saveData({ projects });
    setData(loadData());
  };

  // Analyze Project Portfolio
  let portfolioScore = 0;
  const recommendations: string[] = [];

  if (projects.length === 0) {
    recommendations.push("You have no projects listed. Add at least 2 strong technical projects.");
  } else {
    // Base score from quantity
    portfolioScore += Math.min(40, projects.length * 20);
    
    // Quality multipliers
    const hasGithub = projects.some(p => p.githubUrl && p.githubUrl.length > 5);
    const hasLive = projects.some(p => p.liveUrl && p.liveUrl.length > 5);
    const hasHard = projects.some(p => p.difficulty === 'Hard');
    const hasDescriptions = projects.every(p => p.description && p.description.length > 20);

    if (hasGithub) portfolioScore += 20;
    else recommendations.push("Add GitHub repository links to your projects to showcase your code.");

    if (hasLive) portfolioScore += 20;
    else recommendations.push("Deploy at least one project live (e.g. Vercel, Netlify, Render) so recruiters can test it.");

    if (hasHard) portfolioScore += 10;
    else recommendations.push("Include a complex, 'Hard' difficulty project to stand out from generic tutorials.");

    if (hasDescriptions) portfolioScore += 10;
    else recommendations.push("Write detailed descriptions for all projects. Mention the problem solved and your specific role.");
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Project Portfolio Analyzer</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track and evaluate the strength of your technical projects.</p>
        </div>
        <Button onClick={saveProjects} className="w-full sm:w-auto">Save Portfolio</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Card */}
        <Card className="glass-panel lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Portfolio Strength</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center">
              <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-8 border-muted mb-4">
                <div 
                  className={`absolute inset-0 rounded-full border-8 ${portfolioScore >= 80 ? 'border-success' : portfolioScore >= 50 ? 'border-gold' : 'border-destructive'}`}
                  style={{ clipPath: `polygon(0 0, 100% 0, 100% ${portfolioScore}%, 0 ${portfolioScore}%)`, transform: 'rotate(-90deg)' }}
                />
                <div className="flex flex-col items-center justify-center z-10">
                  <span className="text-3xl font-bold">{portfolioScore}</span>
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {portfolioScore >= 80 ? 'Excellent portfolio!' : portfolioScore >= 50 ? 'Good, but needs polish.' : 'Weak portfolio.'}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <h4 className="font-semibold text-sm">Actionable Recommendations:</h4>
              {recommendations.length === 0 ? (
                <div className="flex gap-2 items-start text-sm text-success">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  Your portfolio is well-structured and properly deployed!
                </div>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2 items-start text-sm">
                    <AlertTriangle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{rec}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project List */}
        <div className="lg:col-span-2 space-y-4">
          {projects.length === 0 ? (
            <Card className="glass-panel border-dashed border-border/50">
              <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
                <Code2 className="h-10 w-10 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No projects added yet.</p>
                <Button onClick={addProject} variant="outline">Add Your First Project</Button>
              </CardContent>
            </Card>
          ) : (
            projects.map((proj, index) => (
              <Card key={proj.id} className="glass-panel border-accent/20">
                <CardHeader className="pb-3 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Project #{index + 1}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeProject(proj.id)} className="text-destructive h-8 w-8 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input value={proj.name} onChange={(e) => updateProject(proj.id, 'name', e.target.value)} placeholder="E.g. E-Commerce Platform" />
                    </div>
                    <div className="space-y-2">
                      <Label>Core Technology</Label>
                      <Input value={proj.technology} onChange={(e) => updateProject(proj.id, 'technology', e.target.value)} placeholder="E.g. React, Node, MongoDB" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description & Role</Label>
                    <Input value={proj.description} onChange={(e) => updateProject(proj.id, 'description', e.target.value)} placeholder="Briefly describe what it does and your contribution" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Github className="h-3 w-3"/> GitHub URL</Label>
                      <Input value={proj.githubUrl || ''} onChange={(e) => updateProject(proj.id, 'githubUrl', e.target.value)} placeholder="https://github.com/..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><ExternalLink className="h-3 w-3"/> Live Demo URL</Label>
                      <Input value={proj.liveUrl || ''} onChange={(e) => updateProject(proj.id, 'liveUrl', e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          
          {projects.length > 0 && (
            <Button variant="outline" onClick={addProject} className="w-full border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Add Another Project
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
