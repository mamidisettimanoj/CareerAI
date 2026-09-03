import React from 'react';
import { getDashboardMetricsAction } from '@/actions/applications';
import { ApplicationService } from '@/domain/applications/service/ApplicationService';
import { PrismaClient } from '@prisma/client';
import { requireCareerUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const prisma = new PrismaClient();
const applicationService = new ApplicationService(prisma);

export default async function ApplicationsDashboard() {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) return <div>Profile required</div>;

  const applicationsResult = await applicationService.listApplications(profileId);
  const applications = applicationsResult.data;
  const metricsResult = await getDashboardMetricsAction();
  const metrics = metricsResult.success ? metricsResult.metrics : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Briefcase className="text-blue-600" /> Application Tracker</h1>
          <p className="text-muted-foreground mt-1">Manage and track your job applications deterministically.</p>
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tracked</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalApplications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeApplications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.interviews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.interviewRate !== null ? `Rate: ${metrics.interviewRate.toFixed(1)}%` : 'INSUFFICIENT_DATA'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.offers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.offerRate !== null ? `Rate: ${metrics.offerRate.toFixed(1)}%` : 'INSUFFICIENT_DATA'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No applications tracked yet.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Role & Company</th>
                <th className="px-6 py-4 font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 font-medium text-slate-500">Applied</th>
                <th className="px-6 py-4 font-medium text-slate-500">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((app: any) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/applications/${app.id}`} className="font-semibold text-blue-600 hover:underline block">
                      {app.jobTitleSnapshot}
                    </Link>
                    <span className="text-xs text-slate-500">{app.companySnapshot}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={app.status === 'REJECTED' ? 'destructive' : app.status === 'OFFER' || app.status === 'ACCEPTED' ? 'default' : 'secondary'}>
                      {app.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {app.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
