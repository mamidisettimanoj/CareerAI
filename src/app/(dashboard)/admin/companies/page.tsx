import { requireSuperAdmin } from '@/lib/auth';
import { AdminCompanyService } from '@/domain/admin/service/AdminCompanyService';
import { prisma } from '@/lib/prisma';
import { AdminCompaniesClient } from '@/components/admin/AdminCompaniesClient';

export const metadata = {
  title: 'Company Management — Admin',
  description: 'Manage companies and recruiter memberships',
};

export default async function AdminCompaniesPage() {
  await requireSuperAdmin();
  const companyService = new AdminCompanyService(prisma);
  const initialData = await companyService.listCompanies(1, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Management</h1>
        <p className="text-muted-foreground mt-1">Create, inspect, and manage recruiter company access</p>
      </div>
      <AdminCompaniesClient initialData={initialData} />
    </div>
  );
}
