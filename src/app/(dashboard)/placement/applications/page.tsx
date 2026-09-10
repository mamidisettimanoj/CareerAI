"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ApplicationStatus } from '@/domain/placement/types/placement.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronRight, Briefcase } from 'lucide-react';
import Link from 'next/link';

const STAGES: { id: ApplicationStatus, label: string }[] = [
  { id: 'SAVED', label: 'Saved' },
  { id: 'APPLIED', label: 'Applied' },
  { id: 'ASSESSMENT', label: 'Assessment' },
  { id: 'INTERVIEWING', label: 'Interviewing' },
  { id: 'OFFERED', label: 'Offers' },
  { id: 'ACCEPTED', label: 'Accepted' },
];

export default function ApplicationsPipeline() {
  const applications = useLiveQuery(() => db.applications.toArray()) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Application Pipeline
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Track the status of all your ongoing placement applications.</p>
        </div>
        <Link href="/placement/companies">
          <Badge variant="outline" className="px-3 py-1 cursor-pointer bg-primary/5 hover:bg-primary/10">
            + Find Companies
          </Badge>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const appsInStage = applications.filter(a => a.status === stage.id);
          
          if (appsInStage.length === 0 && (stage.id === 'ACCEPTED' || stage.id === 'OFFERED')) return null;

          return (
            <div key={stage.id} className="space-y-4 min-w-[280px]">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{stage.label}</h3>
                <Badge variant="secondary">{appsInStage.length}</Badge>
              </div>

              <div className="space-y-3">
                {appsInStage.map(app => (
                  <Link key={app.id} href={`/placement/applications/detail?id=${app.id}`}>
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold">{app.companyName}</h4>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {app.roleTitle}
                        </p>
                        <div className="text-[10px] text-muted-foreground pt-2 border-t mt-2">
                          Applied: {new Date(app.appliedDate).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {appsInStage.length === 0 && (
                  <div className="p-4 border-2 border-dashed rounded-lg text-center text-xs text-muted-foreground">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
