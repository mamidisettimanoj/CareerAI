'use client';

import { useState, useTransition } from 'react';
import {
  listInstitutionsAction,
  createInstitutionAction,
  changeInstitutionStatusAction,
  assignPlacementAdminAction,
} from '@/actions/admin';
import { InstitutionStatus } from '@prisma/client';

type Institution = { id: string; name: string; status: InstitutionStatus; userCount: number; driveCount: number; createdAt: Date };

interface AdminInstitutionsClientProps {
  initialData: { data: Institution[]; metadata: any };
}

export function AdminInstitutionsClient({ initialData }: AdminInstitutionsClientProps) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [assignForm, setAssignForm] = useState({ userId: '', institutionId: '' });
  const [showAssign, setShowAssign] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<Institution | null>(null);

  function fetchInstitutions(p = 1) {
    setError('');
    startTransition(async () => {
      try {
        const result = await listInstitutionsAction({ page: p, pageSize: 20, search: search || undefined, status: (statusFilter as InstitutionStatus) || undefined });
        setData(result as any);
        setPage(p);
      } catch (e: any) { setError(e.message); }
    });
  }

  async function handleCreate() {
    setError(''); setSuccess('');
    try {
      await createInstitutionAction({ name: newName.trim() });
      setSuccess(`Institution "${newName.trim()}" created.`);
      setShowCreate(false); setNewName('');
      fetchInstitutions(1);
    } catch (e: any) { setError(e.message); }
  }

  async function handleArchive(inst: Institution) {
    setError(''); setSuccess('');
    const newStatus: InstitutionStatus = inst.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    try {
      await changeInstitutionStatusAction({ institutionId: inst.id, newStatus });
      setSuccess(`Institution "${inst.name}" ${newStatus === 'ARCHIVED' ? 'archived' : 'reactivated'}.`);
      setConfirmArchive(null);
      fetchInstitutions(page);
    } catch (e: any) { setError(e.message); setConfirmArchive(null); }
  }

  async function handleAssign() {
    setError(''); setSuccess('');
    try {
      await assignPlacementAdminAction({ targetUserId: assignForm.userId, institutionId: assignForm.institutionId });
      setSuccess('Placement Admin assigned successfully.');
      setAssignForm({ userId: '', institutionId: '' }); setShowAssign(false);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search institutions..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchInstitutions(1)} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] bg-background" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">All Statuses</option>
          {Object.values(InstitutionStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => fetchInstitutions(1)} disabled={isPending} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Search</button>
        <button id="create-institution-btn" onClick={() => setShowCreate(true)} className="border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/5">+ New</button>
        <button id="assign-placement-admin-btn" onClick={() => setShowAssign(true)} className="border border-cyan-500 text-cyan-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-50">Assign Admin</button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-left p-3 font-semibold">Users</th>
              <th className="text-left p-3 font-semibold">Drives</th>
              <th className="text-left p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.data.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No institutions found.</td></tr>
            ) : data.data.map(inst => (
              <tr key={inst.id} className="hover:bg-muted/20">
                <td className="p-3 font-medium">{inst.name}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inst.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{inst.status}</span></td>
                <td className="p-3">{inst.userCount}</td>
                <td className="p-3">{inst.driveCount}</td>
                <td className="p-3">
                  <button onClick={() => setConfirmArchive(inst)} className={`text-xs border rounded px-2 py-1 hover:bg-muted ${inst.status === 'ACTIVE' ? 'text-amber-600 border-amber-300' : 'text-green-600 border-green-300'}`}>
                    {inst.status === 'ACTIVE' ? 'Archive' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Total: {data.metadata.totalCount}</span>
        <div className="flex gap-2">
          <button onClick={() => fetchInstitutions(page - 1)} disabled={page <= 1 || isPending} className="border rounded px-3 py-1 hover:bg-muted disabled:opacity-40">Previous</button>
          <span className="px-3 py-1">Page {page}</span>
          <button onClick={() => fetchInstitutions(page + 1)} disabled={!data.metadata.hasNext || isPending} className="border rounded px-3 py-1 hover:bg-muted disabled:opacity-40">Next</button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg">Create Institution</h3>
            <input id="new-institution-name" type="text" placeholder="Institution name *" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="border rounded-lg px-4 py-2 text-sm hover:bg-muted">Cancel</button>
              <button id="create-institution-confirm" onClick={handleCreate} disabled={!newName.trim()} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg">Assign Placement Admin</h3>
            <p className="text-sm text-muted-foreground">Target user must have PLACEMENT_ADMIN role.</p>
            <input id="assign-pa-user-id" type="text" placeholder="User ID (UUID)" value={assignForm.userId} onChange={e => setAssignForm(f => ({ ...f, userId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
            <input id="assign-pa-institution-id" type="text" placeholder="Institution ID (UUID)" value={assignForm.institutionId} onChange={e => setAssignForm(f => ({ ...f, institutionId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAssign(false)} className="border rounded-lg px-4 py-2 text-sm hover:bg-muted">Cancel</button>
              <button id="assign-pa-confirm" onClick={handleAssign} disabled={!assignForm.userId.trim() || !assignForm.institutionId.trim()} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Assign</button>
            </div>
          </div>
        </div>
      )}

      {confirmArchive && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg">Confirm {confirmArchive.status === 'ACTIVE' ? 'Archive' : 'Reactivate'}</h3>
            <p className="text-sm text-muted-foreground">
              {confirmArchive.status === 'ACTIVE'
                ? `Archiving "${confirmArchive.name}" preserves all historical data.`
                : `Reactivating "${confirmArchive.name}" will allow placement admins to log in again.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmArchive(null)} className="border rounded-lg px-4 py-2 text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => handleArchive(confirmArchive)} className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-amber-700">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
