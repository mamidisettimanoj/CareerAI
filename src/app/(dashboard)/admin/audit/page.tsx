import { requireSuperAdmin } from '@/lib/auth';
import { AdminAuditService } from '@/domain/admin/service/AdminAuditService';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Audit Log — Admin',
  description: 'Immutable administrative audit trail',
};

const auditService = new AdminAuditService(prisma);

const ACTION_COLORS: Record<string, string> = {
  CHANGE_USER_ROLE: 'bg-purple-100 text-purple-700',
  CHANGE_USER_STATUS: 'bg-amber-100 text-amber-700',
  CREATE_COMPANY: 'bg-blue-100 text-blue-700',
  CHANGE_COMPANY_STATUS: 'bg-rose-100 text-rose-700',
  CREATE_INSTITUTION: 'bg-cyan-100 text-cyan-700',
  CHANGE_INSTITUTION_STATUS: 'bg-teal-100 text-teal-700',
  ASSIGN_RECRUITER: 'bg-emerald-100 text-emerald-700',
  REMOVE_RECRUITER: 'bg-red-100 text-red-700',
  ASSIGN_PLACEMENT_ADMIN: 'bg-indigo-100 text-indigo-700',
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: { page?: string; entityType?: string };
}) {
  await requireSuperAdmin();
  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const entityType = searchParams.entityType;

  const result = await auditService.listEvents(page, 50, entityType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Immutable record of all administrative actions</p>
        </div>
        <div className="text-sm text-muted-foreground border rounded-lg px-3 py-2 bg-muted/20">
          🔒 Read-only — events cannot be modified or deleted
        </div>
      </div>

      {result.data.length === 0 ? (
        <div className="border rounded-xl p-12 text-center text-muted-foreground">
          No audit events recorded yet. Administrative actions will appear here.
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-semibold">When</th>
                <th className="text-left p-3 font-semibold">Actor</th>
                <th className="text-left p-3 font-semibold">Action</th>
                <th className="text-left p-3 font-semibold">Entity</th>
                <th className="text-left p-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.data.map(event => (
                <tr key={event.id} className="hover:bg-muted/20">
                  <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(event.occurredAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-xs">{event.actorEmail}</div>
                    <div className="text-xs text-muted-foreground">{event.actorRole}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[event.action] || 'bg-gray-100 text-gray-700'}`}>
                      {event.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-xs font-medium">{event.entityType}</div>
                    <div className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">{event.entityId}</div>
                  </td>
                  <td className="p-3">
                    {event.metadata ? (
                      <pre className="text-xs text-muted-foreground max-w-[200px] overflow-x-auto">{JSON.stringify(event.metadata, null, 0)}</pre>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Total events: {result.metadata.totalCount}</span>
        <div className="flex gap-2">
          {page > 1 && (
            <a href={`/admin/audit?page=${page - 1}${entityType ? `&entityType=${entityType}` : ''}`}
              className="border rounded px-3 py-1 hover:bg-muted">Previous</a>
          )}
          <span className="px-3 py-1">Page {page}</span>
          {result.metadata.hasNext && (
            <a href={`/admin/audit?page=${page + 1}${entityType ? `&entityType=${entityType}` : ''}`}
              className="border rounded px-3 py-1 hover:bg-muted">Next</a>
          )}
        </div>
      </div>
    </div>
  );
}
