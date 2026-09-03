import { requireSuperAdmin } from '@/lib/auth';
import { AdminInstitutionService } from '@/domain/admin/service/AdminInstitutionService';
import { prisma } from '@/lib/prisma';
import { AdminInstitutionsClient } from '@/components/admin/AdminInstitutionsClient';

export const metadata = {
  title: 'Institution Management — Admin',
  description: 'Manage academic institutions and placement admin assignments',
};

export default async function AdminInstitutionsPage() {
  await requireSuperAdmin();
  const institutionService = new AdminInstitutionService(prisma);
  const initialData = await institutionService.listInstitutions(1, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Institution Management</h1>
        <p className="text-muted-foreground mt-1">Create and manage institutions, assign Placement Administrators</p>
      </div>
      <AdminInstitutionsClient initialData={initialData} />
    </div>
  );
}
