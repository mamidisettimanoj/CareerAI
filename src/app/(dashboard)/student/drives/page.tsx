import { requireStudent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { driveEligibilityEngine } from '@/domain/placement/engine/DriveEligibilityEngine';

export default async function StudentDrivesPage() {
  const user = await requireStudent();
  const profileId = user.profile?.id;
  if (!profileId) return <div>Profile required.</div>;

  // For students, we get the drives associated with their institution (if linked)
  const studentInst = user.institutionId;
  if (!studentInst) return <div className="p-8 text-center text-slate-500">You are not currently enrolled in a placement cell institution.</div>;

  const drives = await prisma.placementDrive.findMany({
    where: { institutionId: studentInst, status: 'OPEN' },
    include: { company: true, eligibilityRules: { orderBy: { version: 'desc' }, take: 1 } }
  });

  const profileData = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { education: true, skills: true }
  });

  const participations = await prisma.placementDriveParticipation.findMany({
    where: { profileId, placementDriveId: { in: drives.map(d => d.id) } }
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Campus Placement Drives</h1>

      <div className="grid gap-6">
        {drives.map(drive => {
          const rule = drive.eligibilityRules[0] || null;
          const eligibility = driveEligibilityEngine.evaluate(profileData as any, rule);
          const part = participations.find(p => p.placementDriveId === drive.id);

          return (
            <div key={drive.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{drive.company?.name}</h2>
                  <p className="text-slate-600 font-medium mt-1">{drive.roles.join(', ')}</p>
                </div>
                {part ? (
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg">{part.status}</span>
                ) : eligibility.status === 'ELIGIBLE' ? (
                  <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Apply Now</button>
                ) : (
                  <span className="px-4 py-2 bg-slate-100 text-slate-500 font-semibold rounded-lg">Not Eligible</span>
                )}
              </div>
              
              {!part && eligibility.status !== 'ELIGIBLE' && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  <strong>Reason:</strong> {eligibility.reasons.join(' ')}
                </div>
              )}
            </div>
          );
        })}
        {drives.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            No active placement drives found.
          </div>
        )}
      </div>
    </div>
  );
}
