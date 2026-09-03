'use client';

import { useState, useTransition } from 'react';
import {
  listCompaniesAction,
  createCompanyAction,
  changeCompanyStatusAction,
  listMembershipsByCompanyAction,
  assignRecruiterAction,
  removeRecruiterAction,
} from '@/actions/admin';
import { CompanyStatus } from '@prisma/client';

type Company = { id: string; name: string; description: string | null; website: string | null; status: CompanyStatus; institutionId: string | null; recruiterCount: number; jobCount: number };
type Membership = { id: string; userId: string; userEmail: string; companyId: string; companyName: string; role: string; createdAt: Date };

interface AdminCompaniesClientProps {
  initialData: { data: Company[]; metadata: any };
}

export function AdminCompaniesClient({ initialData }: AdminCompaniesClientProps) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', website: '' });
  const [membershipsPanel, setMembershipsPanel] = useState<{ companyId: string; companyName: string; data: Membership[] } | null>(null);
  const [assignForm, setAssignForm] = useState({ userId: '', companyId: '' });
  const [confirmArchive, setConfirmArchive] = useState<Company | null>(null);

  function fetchCompanies(p = 1) {
    setError('');
    startTransition(async () => {
      try {
        const result = await listCompaniesAction({ page: p, pageSize: 20, search: search || undefined, status: (statusFilter as CompanyStatus) || undefined });
        setData(result as any);
        setPage(p);
      } catch (e: any) { setError(e.message); }
    });
  }

  async function handleCreate() {
    setError(''); setSuccess('');
    try {
      await createCompanyAction({ name: createForm.name, description: createForm.description || undefined, website: createForm.website || undefined });
      setSuccess(`Company "${createForm.name}" created.`);
      setShowCreate(false);
      setCreateForm({ name: '', description: '', website: '' });
      fetchCompanies(1);
    } catch (e: any) { setError(e.message); }
  }

  async function handleArchive(company: Company) {
    setError(''); setSuccess('');
    const newStatus: CompanyStatus = company.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    try {
      await changeCompanyStatusAction({ companyId: company.id, newStatus });
      setSuccess(`Company "${company.name}" ${newStatus === 'ARCHIVED' ? 'archived' : 'reactivated'}.`);
      setConfirmArchive(null);
      fetchCompanies(page);
    } catch (e: any) { setError(e.message); setConfirmArchive(null); }
  }

  async function openMemberships(company: Company) {
    setError('');
    try {
      const result = await listMembershipsByCompanyAction(company.id);
      setMembershipsPanel({ companyId: company.id, companyName: company.name, data: result.data as Membership[] });
    } catch (e: any) { setError(e.message); }
  }

  async function handleAssignRecruiter() {
    setError(''); setSuccess('');
    try {
      await assignRecruiterAction({ targetUserId: assignForm.userId, companyId: assignForm.companyId });
      setSuccess('Recruiter assigned successfully.');
      setAssignForm({ userId: '', companyId: '' });
      if (membershipsPanel) openMemberships({ id: membershipsPanel.companyId, name: membershipsPanel.companyName } as Company);
    } catch (e: any) { setError(e.message); }
  }

  async function handleRemoveRecruiter(userId: string, companyId: string) {
    setError(''); setSuccess('');
    try {
      await removeRecruiterAction({ targetUserId: userId, companyId });
      setSuccess('Recruiter removed.');
      if (membershipsPanel) openMemberships({ id: companyId, name: membershipsPanel.companyName } as Company);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchCompanies(1)} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] bg-background" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">All Statuses</option>
          {Object.values(CompanyStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => fetchCompanies(1)} disabled={isPending} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Search</button>
        <button id="create-company-btn" onClick={() => setShowCreate(true)} className="border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/5">+ New Company</button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-left p-3 font-semibold">Recruiters</th>
              <th className="text-left p-3 font-semibold">Jobs</th>
              <th className="text-left p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.data.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No companies found.</td></tr>
            ) : data.data.map(c => (
              <tr key={c.id} className="hover:bg-muted/20">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span></td>
                <td className="p-3">{c.recruiterCount}</td>
                <td className="p-3">{c.jobCount}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => openMemberships(c)} className="text-xs border rounded px-2 py-1 hover:bg-muted">Memberships</button>
                    <button onClick={() => setConfirmArchive(c)} className={`text-xs border rounded px-2 py-1 hover:bg-muted ${c.status === 'ACTIVE' ? 'text-amber-600 border-amber-300' : 'text-green-600 border-green-300'}`}>
                      {c.status === 'ACTIVE' ? 'Archive' : 'Reactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Total: {data.metadata.totalCount}</span>
        <div className="flex gap-2">
          <button onClick={() => fetchCompanies(page - 1)} disabled={page <= 1 || isPending} className="border rounded px-3 py-1 hover:bg-muted disabled:opacity-40">Previous</button>
          <span className="px-3 py-1">Page {page}</span>
          <button onClick={() => fetchCompanies(page + 1)} disabled={!data.metadata.hasNext || isPending} className="border rounded px-3 py-1 hover:bg-muted disabled:opacity-40">Next</button>
        </div>
      </div>

      {/* Create company modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg">Create Company</h3>
            <input id="new-company-name" type="text" placeholder="Company name *" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
            <input type="text" placeholder="Description" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
            <input type="url" placeholder="Website URL" value={createForm.website} onChange={e => setCreateForm(f => ({ ...f, website: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="border rounded-lg px-4 py-2 text-sm hover:bg-muted">Cancel</button>
              <button id="create-company-confirm" onClick={handleCreate} disabled={!createForm.name.trim()} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Memberships panel */}
      {membershipsPanel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Memberships: {membershipsPanel.companyName}</h3>
              <button onClick={() => setMembershipsPanel(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            {membershipsPanel.data.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recruiters assigned to this company.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/40"><th className="text-left p-2">Email</th><th className="text-left p-2">Role</th><th className="text-left p-2">Since</th><th className="p-2"></th></tr></thead>
                <tbody className="divide-y">
                  {membershipsPanel.data.map(m => (
                    <tr key={m.id}>
                      <td className="p-2 font-mono text-xs">{m.userEmail}</td>
                      <td className="p-2 text-xs">{m.role}</td>
                      <td className="p-2 text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</td>
                      <td className="p-2">
                        <button onClick={() => handleRemoveRecruiter(m.userId, m.companyId)} className="text-xs text-red-600 border border-red-300 rounded px-2 py-0.5 hover:bg-red-50">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="border-t pt-4 space-y-2">
              <h4 className="font-semibold text-sm">Assign Recruiter</h4>
              <div className="flex gap-2">
                <input id="assign-user-id" type="text" placeholder="User ID (UUID)" value={assignForm.userId} onChange={e => setAssignForm(f => ({ ...f, userId: e.target.value, companyId: membershipsPanel.companyId }))} className="flex-1 border rounded px-2 py-1 text-xs bg-background" />
                <button id="assign-recruiter-btn" onClick={handleAssignRecruiter} disabled={!assignForm.userId.trim()} className="bg-primary text-primary-foreground rounded px-3 py-1 text-xs font-medium hover:bg-primary/90 disabled:opacity-50">Assign</button>
              </div>
              <p className="text-xs text-muted-foreground">⚠️ Target user must have RECRUITER role and no existing membership.</p>
            </div>
          </div>
        </div>
      )}

      {/* Archive confirm */}
      {confirmArchive && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg">Confirm {confirmArchive.status === 'ACTIVE' ? 'Archive' : 'Reactivate'}</h3>
            <p className="text-sm text-muted-foreground">
              {confirmArchive.status === 'ACTIVE'
                ? `Archiving "${confirmArchive.name}" will prevent new recruiter logins for this company. All historical data is preserved.`
                : `Reactivating "${confirmArchive.name}" will allow recruiters to log in again.`}
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
