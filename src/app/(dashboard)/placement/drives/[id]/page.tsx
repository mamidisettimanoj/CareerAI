import { requirePlacementAdmin } from '@/lib/auth';
import { PlacementDriveService } from '@/domain/placement/service/PlacementDriveService';
import { prisma } from '@/lib/prisma';

const driveService = new PlacementDriveService(prisma);

export default async function DriveDetailPage({ params }: { params: { id: string } }) {
  const admin = await requirePlacementAdmin();
  const drive = await driveService.getDrive(admin.institutionId, params.id);

  const participants = await prisma.placementDriveParticipation.findMany({
    where: { placementDriveId: params.id },
    include: { profile: true }
  });

  const rule = drive.eligibilityRules[0];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-bold">{drive.company?.name}</h1>
          <p className="text-slate-500 mt-2">Roles: {drive.roles.join(', ')}</p>
        </div>
        <span className="px-4 py-2 rounded-full font-semibold bg-blue-100 text-blue-700">
          {drive.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4">Eligibility Rules</h2>
          {rule ? (
            <ul className="space-y-2 text-slate-700">
              <li><strong>Min CGPA:</strong> {rule.minCgpa ?? 'None'}</li>
              <li><strong>Max Active Backlogs:</strong> {rule.maxActiveBacklogs ?? 'None'}</li>
              <li><strong>Allowed Branches:</strong> {rule.allowedBranches.length ? rule.allowedBranches.join(', ') : 'Any'}</li>
              <li><strong>Required Skills:</strong> {rule.requiredSkills.length ? rule.requiredSkills.join(', ') : 'None'}</li>
            </ul>
          ) : (
            <p className="text-slate-500">No strict rules configured.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4">Statistics</h2>
          <ul className="space-y-2 text-slate-700">
            <li><strong>Total Registered:</strong> {participants.length}</li>
            <li><strong>Shortlisted:</strong> {participants.filter(p => p.status === 'SHORTLISTED').length}</li>
            <li><strong>Selected:</strong> {participants.filter(p => p.status === 'SELECTED').length}</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold">Participants</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Eligibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {participants.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold">{p.profile.firstName} {p.profile.lastName}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.eligibilityResult === 'ELIGIBLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {p.eligibilityResult}
                  </span>
                </td>
              </tr>
            ))}
            {participants.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  No participants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
