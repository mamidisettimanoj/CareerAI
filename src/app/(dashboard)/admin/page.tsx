import { requireSuperAdmin } from '@/lib/auth';
import { AdminMetricsService } from '@/domain/admin/service/AdminMetricsService';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, Building, GraduationCap, Briefcase, Activity, FileCheck, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Admin Portal — CareerAI',
  description: 'Platform administration dashboard for CareerAI',
};

const metricsService = new AdminMetricsService(prisma);

export default async function AdminDashboardPage() {
  await requireSuperAdmin();
  const metrics = await metricsService.getPlatformMetrics();

  const statCards = [
    { label: 'Total Users', value: metrics.totalUsers, sub: `${metrics.activeUsers} active`, href: '/admin/users', icon: Users, color: 'text-primary' },
    { label: 'Students', value: metrics.students, sub: 'registered learners', href: '/admin/users?role=STUDENT', icon: GraduationCap, color: 'text-info' },
    { label: 'Recruiters', value: metrics.recruiters, sub: `${metrics.recruiterMemberships} memberships`, href: '/admin/memberships', icon: Briefcase, color: 'text-success' },
    { label: 'Placement Admins', value: metrics.placementAdmins, sub: 'institution-scoped', href: '/admin/users?role=PLACEMENT_ADMIN', icon: FileCheck, color: 'text-warning' },
    { label: 'Companies', value: metrics.totalCompanies, sub: `${metrics.activeCompanies} active`, href: '/admin/companies', icon: Building, color: 'text-primary' },
    { label: 'Institutions', value: metrics.totalInstitutions, sub: `${metrics.activeInstitutions} active`, href: '/admin/institutions', icon: GraduationCap, color: 'text-info' },
  ];

  const navItems = [
    { href: '/admin/users', label: 'User Management', icon: Users, desc: 'Manage roles, status, and account lifecycle' },
    { href: '/admin/companies', label: 'Company Management', icon: Building, desc: 'Create, inspect, and archive companies' },
    { href: '/admin/institutions', label: 'Institution Management', icon: GraduationCap, desc: 'Manage academic institutions' },
    { href: '/admin/memberships', label: 'Recruiter Memberships', icon: FileCheck, desc: 'Assign and remove recruiter company access' },
    { href: '/admin/audit', label: 'Audit Log', icon: Activity, desc: 'Immutable record of administrative actions' },
  ];

  return (
    <div className="space-y-8 w-full min-w-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Admin Portal</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Platform administration and governance</p>
        
        {metrics.suspendedUsers > 0 && (
          <Alert variant="destructive" className="mt-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              {metrics.suspendedUsers} suspended account{metrics.suspendedUsers !== 1 ? 's' : ''} require review.{' '}
              <Link href="/admin/users?accountStatus=SUSPENDED" className="font-semibold underline">Review now</Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Platform Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map(card => {
            const inner = (
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            );
            return card.href ? (
              <Link key={card.label} href={card.href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={card.label}>{inner}</div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Administration Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
            >
              <Card className="h-full hover:border-primary hover:shadow-sm transition-all duration-150">
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">{item.label}</CardTitle>
                    <CardDescription className="mt-1">{item.desc}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { role: 'STUDENT', count: metrics.students, color: 'text-info' },
              { role: 'RECRUITER', count: metrics.recruiters, color: 'text-success' },
              { role: 'PLACEMENT_ADMIN', count: metrics.placementAdmins, color: 'text-warning' },
              { role: 'SUPER_ADMIN', count: metrics.superAdmins, color: 'text-destructive' },
            ].map(r => (
              <div key={r.role} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground font-medium">{r.role}</span>
                <span className={`font-bold text-lg ${r.color}`}>{r.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
