import { requirePlacementAdmin } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Building2, Users, Briefcase, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PlacementDashboardPage() {
  const admin = await requirePlacementAdmin();

  // Deterministic Statistics directly from DB
  const [totalDrives, activeDrives, companies, participants] = await Promise.all([
    prisma.placementDrive.count({ where: { institutionId: admin.institutionId } }),
    prisma.placementDrive.count({ where: { institutionId: admin.institutionId, status: 'OPEN' } }),
    prisma.company.count({ where: { institutionId: admin.institutionId } }),
    prisma.placementDriveParticipation.count({ where: { placementDrive: { institutionId: admin.institutionId } } })
  ]);

  return (
    <div className="space-y-8 w-full min-w-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Placement Cell Portal</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Manage institutional drives, companies, and student participation.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Drives</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrives}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Drives</CardTitle>
            <Briefcase className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDrives}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registrations</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/placement/drives" className="flex items-center justify-between p-4 rounded-lg bg-muted/40 hover:bg-muted transition-colors border">
              <span className="font-medium text-foreground">Manage Placement Drives</span>
              <ChevronRight size={20} className="text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
