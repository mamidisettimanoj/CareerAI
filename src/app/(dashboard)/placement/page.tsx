"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Building, FileText, Target, Trophy, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function PlacementDashboard() {
  const applications = useLiveQuery(() => db.applications.toArray()) || [];
  const interviews = useLiveQuery(() => db.interviews.toArray()) || [];
  const offers = useLiveQuery(() => db.offers.toArray()) || [];

  const totalApplications = applications.length;
  const interviewing = applications.filter(a => a.status === 'INTERVIEWING').length;
  const totalOffers = offers.length;
  const highestOffer = offers.length > 0 ? Math.max(...offers.map(o => o.ctc)) : 0;
  const avgOffer = offers.length > 0 ? offers.reduce((acc, o) => acc + o.ctc, 0) / offers.length : 0;

  const upcomingInterviews = interviews
    .filter(i => i.status === 'SCHEDULED' && new Date(i.date).getTime() >= Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" /> Placement Center
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your applications, interviews, and track your placement funnel.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applications</p>
                <p className="text-3xl font-bold">{totalApplications}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interviewing</p>
                <p className="text-3xl font-bold">{interviewing}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offers</p>
                <p className="text-3xl font-bold">{totalOffers}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Highest CTC</p>
                <p className="text-3xl font-bold">{highestOffer > 0 ? `${highestOffer}L` : '---'}</p>
              </div>
              <Building className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation Grid */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/placement/companies">
            <Card className="hover:border-primary transition-colors h-full cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Companies & Drives</CardTitle>
                <CardDescription>Browse companies, check eligibility, and register for drives.</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/placement/applications">
            <Card className="hover:border-primary transition-colors h-full cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Applications Pipeline</CardTitle>
                <CardDescription>Kanban board of your ongoing applications and their status.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Upcoming Action Items */}
        <div className="md:col-span-1 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Upcoming Interviews</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {upcomingInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming interviews scheduled.</p>
              ) : (
                <ul className="space-y-4">
                  {upcomingInterviews.map(i => {
                    const app = applications.find(a => a.id === i.applicationId);
                    return (
                      <li key={i.id} className="flex justify-between items-center text-sm border-b pb-3 last:border-0">
                        <div>
                          <p className="font-bold">{app?.companyName || 'Unknown Company'}</p>
                          <p className="text-xs text-muted-foreground">{i.type} Round {i.roundNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{new Date(i.date).toLocaleDateString()}</p>
                          <Link href={`/placement/applications/detail?id=${i.applicationId}`} className="text-xs text-primary flex items-center justify-end">
                            View <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
