"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Database, BrainCircuit, ShieldCheck, Code2 } from 'lucide-react';

export function About() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-heading font-bold text-gradient inline-block">About CareerAI</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Understanding the methodology and technology behind the student career & placement analyzer.
        </p>
        <p className="text-sm font-medium text-accent pt-2">
          Designed by Manoj from KL University
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Prediction Methodology
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              The <strong>Placement Probability Estimate</strong> is calculated using a deterministic, multi-factor scoring algorithm, not a dynamic machine learning model.
            </p>
            <p>
              It simulates how recruiters typically weigh different aspects of a student profile: Academic consistency (CGPA & Backlogs), Technical proficiency, Aptitude, Communication skills, and practical experience (Internships & Projects).
            </p>
            <p className="text-accent font-medium mt-2">
              Disclaimer: This score is strictly an educational tool to help students identify their weak areas. It does not guarantee employment.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              Data Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              CareerAI is a <strong>100% Client-Side</strong> application. This means there is no backend database collecting your personal information.
            </p>
            <p>
              All academic records, scores, and tasks are stored locally within your browser's <code className="bg-muted px-1 py-0.5 rounded">LocalStorage</code>. If you clear your browser data, your profile will be reset.
            </p>
            <p>
              You can use the <strong>Settings</strong> page to export your data securely as a JSON file and import it on another device.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-cyan-400/20 bg-cyan-400/5 mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-cyan-400" />
            Technology Stack
          </CardTitle>
          <CardDescription>Built with modern web technologies for performance and scale.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-bold text-foreground">React 18</div>
              <div className="text-xs text-muted-foreground">UI Library</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-bold text-foreground">TypeScript</div>
              <div className="text-xs text-muted-foreground">Type Safety</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-bold text-foreground">Vite</div>
              <div className="text-xs text-muted-foreground">Build Tool</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-bold text-foreground">Tailwind CSS</div>
              <div className="text-xs text-muted-foreground">Styling System</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-bold text-foreground">shadcn/ui</div>
              <div className="text-xs text-muted-foreground">Components</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-bold text-foreground">Recharts</div>
              <div className="text-xs text-muted-foreground">Data Visualization</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-bold text-foreground">Zod & RHF</div>
              <div className="text-xs text-muted-foreground">Form Validation</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="font-bold text-foreground">LocalStorage</div>
              <div className="text-xs text-muted-foreground">Persistence</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
