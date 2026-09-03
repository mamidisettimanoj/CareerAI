import { requireRecruiter } from '@/lib/auth';
import { getRecruiterJobsAction } from '@/actions/recruitment';
import { CreateJobForm } from '@/components/recruiter/CreateJobForm';
import Link from 'next/link';

const STATUS_BADGE: Record<string, string> = {
  DRAFT:     'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  CLOSED:    'bg-gray-100 text-gray-700',
  ARCHIVED:  'bg-gray-50 text-gray-400',
};

const NEXT_STATUS: Record<string, string> = {
  DRAFT:     'PUBLISHED',
  PUBLISHED: 'CLOSED',
  CLOSED:    'ARCHIVED',
};

export default async function RecruiterJobsPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireRecruiter();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { data: jobs, metadata } = await getRecruiterJobsAction(page);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
        <CreateJobForm />
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">No jobs posted yet.</p>
          <p className="text-sm text-gray-400">Use &quot;Post New Job&quot; to create your first job listing as a DRAFT.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_BADGE[job.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{job.employmentType ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{job.location ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-3">
                    <Link href={`/recruiter/candidates?jobId=${job.id}`} className="text-blue-600 hover:underline">
                      Candidates
                    </Link>
                    {NEXT_STATUS[job.status] && (
                      <Link href={`/recruiter/jobs/${job.id}/status?next=${NEXT_STATUS[job.status]}`} className="text-gray-500 hover:underline">
                        → {NEXT_STATUS[job.status]}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <Link href={`/recruiter/jobs?page=${metadata.page - 1}`}
          className={`px-4 py-2 border rounded-md text-sm ${metadata.page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'}`}>
          Previous
        </Link>
        <span className="text-sm text-gray-500">Page {metadata.page} · {metadata.totalCount} jobs</span>
        <Link href={`/recruiter/jobs?page=${metadata.page + 1}`}
          className={`px-4 py-2 border rounded-md text-sm ${!metadata.hasNext ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'}`}>
          Next
        </Link>
      </div>
    </div>
  );
}
