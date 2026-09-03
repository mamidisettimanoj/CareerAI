'use client';

import { useState, useTransition } from 'react';
import {
  listUsersAction,
  changeUserRoleAction,
  changeUserStatusAction,
} from '@/actions/admin';
import { Role, AccountStatus } from '@prisma/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type User = {
  id: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  institutionId: string | null;
  hasProfile: boolean;
  createdAt: Date;
};

type UsersResult = { data: User[]; metadata: any };

const ROLE_COLORS: Record<Role, string> = {
  STUDENT: 'bg-violet-100 text-violet-700',
  RECRUITER: 'bg-emerald-100 text-emerald-700',
  PLACEMENT_ADMIN: 'bg-amber-100 text-amber-700',
  SUPER_ADMIN: 'bg-rose-100 text-rose-700',
};

const STATUS_COLORS: Record<AccountStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-amber-100 text-amber-800',
  DISABLED: 'bg-red-100 text-red-700',
};

interface AdminUsersClientProps {
  initialData: UsersResult;
}

export function AdminUsersClient({ initialData }: AdminUsersClientProps) {
  const [data, setData] = useState<UsersResult>(initialData);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'role' | 'status';
    userId: string;
    userEmail: string;
    newValue: string;
  } | null>(null);

  function fetchUsers(p = 1) {
    setError('');
    startTransition(async () => {
      try {
        const result = await listUsersAction({
          page: p,
          pageSize: 20,
          search: search || undefined,
          role: (roleFilter as Role) || undefined,
          accountStatus: (statusFilter as AccountStatus) || undefined,
        });
        setData(result as UsersResult);
        setPage(p);
      } catch (e: any) {
        setError(e.message || 'Failed to load users.');
      }
    });
  }

  function handleRoleChange(user: User, newRole: Role) {
    setConfirmDialog({ type: 'role', userId: user.id, userEmail: user.email, newValue: newRole });
  }

  function handleStatusChange(user: User, newStatus: AccountStatus) {
    setConfirmDialog({ type: 'status', userId: user.id, userEmail: user.email, newValue: newStatus });
  }

  async function executeConfirmed() {
    if (!confirmDialog) return;
    setError('');
    setSuccess('');
    try {
      if (confirmDialog.type === 'role') {
        await changeUserRoleAction({ targetUserId: confirmDialog.userId, newRole: confirmDialog.newValue as Role });
        setSuccess(`Role updated to ${confirmDialog.newValue} for ${confirmDialog.userEmail}.`);
      } else {
        await changeUserStatusAction({ targetUserId: confirmDialog.userId, newStatus: confirmDialog.newValue as AccountStatus });
        setSuccess(`Status updated to ${confirmDialog.newValue} for ${confirmDialog.userEmail}.`);
      }
      setConfirmDialog(null);
      fetchUsers(page);
    } catch (e: any) {
      setError(e.message || 'Operation failed.');
      setConfirmDialog(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          id="user-search"
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] bg-background"
        />
        <select id="role-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">All Roles</option>
          {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">All Statuses</option>
          {Object.values(AccountStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          id="user-search-btn"
          onClick={() => fetchUsers(1)}
          disabled={isPending}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Loading...' : 'Search'}
        </button>
      </div>

      {/* Feedback */}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-semibold">Email</th>
                <th className="text-left p-3 font-semibold">Role</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Profile</th>
                <th className="text-left p-3 font-semibold">Joined</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : data.data.map(user => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-mono text-xs">{user.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>{user.role}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[user.accountStatus]}`}>{user.accountStatus}</span>
                  </td>
                  <td className="p-3">{user.hasProfile ? '✅' : '—'}</td>
                  <td className="p-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <select
                        id={`role-change-${user.id}`}
                        defaultValue=""
                        onChange={e => e.target.value && handleRoleChange(user, e.target.value as Role)}
                        className="border rounded px-2 py-1 text-xs bg-background"
                      >
                        <option value="" disabled>Change Role</option>
                        {Object.values(Role).filter(r => r !== user.role).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <select
                        id={`status-change-${user.id}`}
                        defaultValue=""
                        onChange={e => e.target.value && handleStatusChange(user, e.target.value as AccountStatus)}
                        className="border rounded px-2 py-1 text-xs bg-background"
                      >
                        <option value="" disabled>Change Status</option>
                        {Object.values(AccountStatus).filter(s => s !== user.accountStatus).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Total: {data.metadata.totalCount} users</span>
        <div className="flex gap-2">
          <button onClick={() => fetchUsers(page - 1)} disabled={page <= 1 || isPending} className="border rounded px-3 py-1 hover:bg-muted disabled:opacity-40">Previous</button>
          <span className="px-3 py-1">Page {page}</span>
          <button onClick={() => fetchUsers(page + 1)} disabled={!data.metadata.hasNext || isPending} className="border rounded px-3 py-1 hover:bg-muted disabled:opacity-40">Next</button>
        </div>
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={confirmDialog !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
        showTrigger={false}
        title={`Confirm ${confirmDialog?.type === 'role' ? 'Role' : 'Status'} Change`}
        description={
          <div className="space-y-4">
            <p>
              Are you sure you want to change the <strong>{confirmDialog?.type}</strong> of{' '}
              <strong className="text-foreground">{confirmDialog?.userEmail}</strong> to{' '}
              <strong className="text-primary">{confirmDialog?.newValue}</strong>?
            </p>
            {confirmDialog?.newValue === 'SUPER_ADMIN' && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
                ⚠️ You are granting full platform administration access.
              </div>
            )}
          </div>
        }
        confirmText="Confirm Change"
        destructive={confirmDialog?.newValue === 'SUSPENDED' || confirmDialog?.newValue === 'DISABLED'}
        onConfirm={executeConfirmed}
      />
    </div>
  );
}
