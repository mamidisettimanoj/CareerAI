import { requireRecruiter } from '@/lib/auth';
import { getRecruiterCandidatesAction } from '@/actions/recruitment';
import Link from 'next/link';

export default async function RecruiterCandidatesPage({ searchParams }: { searchParams: { page?: string; jobId?: string; stage?: string } }) {
  await requireRecruiter();
  const page = Number(searchParams.page) || 1;
  const { data: candidates, metadata } = await getRecruiterCandidatesAction(page, { jobId: searchParams.jobId, stage: searchParams.stage });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Candidates</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Applied</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600 hover:text-blue-900">
                  <Link href={`/recruiter/candidates/${candidate.id}`}>
                    {candidate.candidateName}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{candidate.jobTitle}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>
                    {candidate.stage}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {candidate.latestEducation || 'N/A'} {candidate.graduationYear ? `(${candidate.graduationYear})` : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(candidate.appliedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No candidates found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <Link 
          href={`/recruiter/candidates?page=${metadata.page - 1}${searchParams.jobId ? `&jobId=${searchParams.jobId}` : ''}`} 
          className={`px-4 py-2 border rounded-md ${metadata.page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
        >
          Previous
        </Link>
        <span className="text-sm text-gray-600">Page {metadata.page}</span>
        <Link 
          href={`/recruiter/candidates?page=${metadata.page + 1}${searchParams.jobId ? `&jobId=${searchParams.jobId}` : ''}`} 
          className={`px-4 py-2 border rounded-md ${!metadata.hasNext ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
