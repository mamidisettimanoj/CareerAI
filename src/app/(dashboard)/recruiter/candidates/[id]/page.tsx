import { requireRecruiter } from '@/lib/auth';
import { getCandidateDetailAction } from '@/actions/recruitment';
import { CandidateActions } from '@/components/recruiter/CandidateActions';
import { ResumeAccessButton } from '@/components/recruiter/ResumeAccessButton';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  await requireRecruiter();

  let detail: Awaited<ReturnType<typeof getCandidateDetailAction>>;
  try {
    detail = await getCandidateDetailAction(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/recruiter/candidates" className="text-sm text-blue-600 hover:underline">← Back to Candidates</Link>
        <span className="text-gray-300">|</span>
        <Link href={`/recruiter/candidates?jobId=${detail.job.id}`} className="text-sm text-blue-600 hover:underline">
          {detail.job.title}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Candidate Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {detail.candidate.firstName} {detail.candidate.lastName}
            </h2>
            <p className="text-sm text-gray-500 mb-4">Applied: {new Date(detail.appliedAt).toLocaleDateString()}</p>

            <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-1 mb-4">
              {detail.candidate.skills.map((s: any) => (
                <span key={s.id} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{s.name}</span>
              ))}
            </div>

            <h3 className="text-sm font-medium text-gray-700 mb-2">Education</h3>
            {detail.candidate.education.map((edu: any) => (
              <div key={edu.id} className="text-sm text-gray-600 mb-1">
                {edu.degreeType} in {edu.branch || 'General'} ({edu.startYear}–{edu.endYear})
                {edu.cgpa && <span className="ml-1 text-gray-400 text-xs">CGPA: {edu.cgpa}</span>}
              </div>
            ))}

            {detail.candidate.experience.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">Experience</h3>
                {detail.candidate.experience.map((exp: any) => (
                  <div key={exp.id} className="text-sm text-gray-600 mb-1">
                    {exp.role} at {exp.company} · {exp.durationMonths}mo
                    {exp.isInternship && <span className="ml-1 text-blue-500 text-xs">Internship</span>}
                  </div>
                ))}
              </>
            )}

            <ResumeAccessButton applicationId={detail.id} resumeMeta={detail.resume} />
          </div>
        </div>

        {/* Right: Actions + History */}
        <div className="lg:col-span-2 space-y-4">
          <CandidateActions
            applicationId={detail.id}
            currentStage={detail.stage}
            currentVersion={detail.version}
          />

          {/* Previous Notes */}
          {detail.notes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Previous Notes</h3>
              <div className="space-y-2">
                {detail.notes.map((note: any) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded text-sm text-gray-700 border-l-2 border-blue-400">
                    <p>{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit History */}
          {detail.history.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Recruitment History</h3>
              <ol className="relative border-l border-gray-200 ml-3">
                {detail.history.map((event: any) => (
                  <li key={event.id} className="mb-4 ml-4">
                    <div className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full mt-1 -left-1.5"></div>
                    <p className="text-sm text-gray-700 font-medium">
                      {event.previousStage ? `${event.previousStage} → ${event.newStage}` : `Started as ${event.newStage}`}
                    </p>
                    {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(event.occurredAt).toLocaleString()}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
