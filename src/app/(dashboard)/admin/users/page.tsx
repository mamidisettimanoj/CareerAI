import { requireSuperAdmin } from '@/lib/auth';
import { AdminUserService } from '@/domain/admin/service/AdminUserService';
import { prisma } from '@/lib/prisma';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

export const metadata = {
  title: 'User Management — Admin',
  description: 'Manage platform user roles and account status',
};

export default async function AdminUsersPage() {
  await requireSuperAdmin();
  const userService = new AdminUserService(prisma);
  const initialData = await userService.listUsers(1, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">Search, filter, and manage platform accounts</p>
      </div>
      <AdminUsersClient initialData={initialData} />
    </div>
  );
}
