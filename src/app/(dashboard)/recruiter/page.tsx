import { requireRecruiter } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, CalendarCheck, Search } from 'lucide-react';

export default async function RecruiterDashboardPage() {
  const recruiter = await requireRecruiter();

  const [company, openJobs, totalCandidates, interviews] = await Promise.all([
    prisma.company.findUnique({ where: { id: recruiter.companyId } }),
    prisma.job.count({ where: { companyId: recruiter.companyId, status: 'PUBLISHED' } }),
    prisma.candidateApplication.count({ where: { job: { companyId: recruiter.companyId } } }),
    prisma.candidateApplication.count({ where: { job: { companyId: recruiter.companyId }, status: 'INTERVIEW' } })
  ]);

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Recruiter Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Welcome, Recruiter for {company?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/recruiter/jobs">
            <Button variant="default" size="sm" className="w-full sm:w-auto"><Briefcase className="h-4 w-4 mr-2" /> Manage Jobs</Button>
          </Link>
          <Link href="/recruiter/candidates">
            <Button variant="outline" size="sm" className="w-full sm:w-auto"><Users className="h-4 w-4 mr-2" /> View Candidates</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently published</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all jobs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Interviews</CardTitle>
            <CalendarCheck className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your feedback</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
