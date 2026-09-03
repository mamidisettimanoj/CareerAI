import { requirePlacementAdmin } from '@/lib/auth';
import { PlacementDriveService } from '@/domain/placement/service/PlacementDriveService';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const driveService = new PlacementDriveService(prisma);

export default async function DrivesPage({ searchParams }: { searchParams: { page?: string, status?: string } }) {
  const admin = await requirePlacementAdmin();
  const page = parseInt(searchParams.page || '1');
  
  const result = await driveService.listDrives(admin.institutionId, { status: searchParams.status }, { page, pageSize: 20 });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Placement Drives</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Roles</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.data.map((drive: any) => (
              <tr key={drive.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold">{drive.company?.name}</td>
                <td className="px-6 py-4 text-slate-600">{drive.roles.join(', ')}</td>
                <td className="px-6 py-4 text-slate-600">{new Date(drive.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {drive.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/placement/drives/${drive.id}`} className="text-blue-600 hover:underline">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
            {result.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No placement drives found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
