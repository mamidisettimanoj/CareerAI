"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { calculatePortfolioCompleteness } from '@/domain/portfolio/engine/PortfolioCompletenessEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Briefcase, FileText, FolderGit2, Trophy, Award, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PortfolioDashboard() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const internships = useLiveQuery(() => db.internships.toArray()) || [];
  const certifications = useLiveQuery(() => db.certifications.toArray()) || [];
  const achievements = useLiveQuery(() => db.achievements.toArray()) || [];
  const resumeVersions = useLiveQuery(() => db.resumeVersions.toArray()) || [];

  const completeness = calculatePortfolioCompleteness(
    profile || null,
    projects,
    internships,
    certifications,
    achievements,
    resumeVersions
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" /> Portfolio Center
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your evidence of skills: Projects, Internships, Certifications, and Resumes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Completeness Card */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Portfolio Completeness</CardTitle>
              <CardDescription>A complete portfolio significantly increases your placement readiness.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-muted-foreground">Score</span>
                  <span className="font-bold text-lg">{completeness.score}%</span>
                </div>
                <Progress value={completeness.score} className="h-3" />
              </div>

              {completeness.missingItems.length > 0 && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg space-y-2">
                  <h4 className="font-bold text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Missing Items</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {completeness.missingItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {completeness.recommendations.length > 0 && (
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <h4 className="font-bold text-sm">Recommendations</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {completeness.recommendations.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <Link href="/projects" className="block">
            <Card className="hover:border-primary transition-colors h-full cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderGit2 className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-bold">Projects</h3>
                    <p className="text-xs text-muted-foreground">{projects.length} recorded</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/internships" className="block">
            <Card className="hover:border-primary transition-colors h-full cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-8 w-8 text-orange-500" />
                  <div>
                    <h3 className="font-bold">Internships</h3>
                    <p className="text-xs text-muted-foreground">{internships.length} recorded</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/certifications" className="block">
            <Card className="hover:border-primary transition-colors h-full cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="font-bold">Certifications</h3>
                    <p className="text-xs text-muted-foreground">{certifications.length} recorded</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/achievements" className="block">
            <Card className="hover:border-primary transition-colors h-full cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h3 className="font-bold">Achievements</h3>
                    <p className="text-xs text-muted-foreground">{achievements.length} recorded</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/resume" className="block">
            <Card className="hover:border-primary transition-colors h-full cursor-pointer bg-primary/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-bold text-primary">Resume Studio</h3>
                    <p className="text-xs text-muted-foreground">{resumeVersions.length} versions</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
