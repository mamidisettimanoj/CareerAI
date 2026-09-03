'use client';

import { useState } from 'react';
import { getResumeSignedUrlAction } from '@/actions/recruitment';

interface Props {
  applicationId: string;
  resumeMeta: { id: string; status: string; completeness: string } | null;
}

export function ResumeAccessButton({ applicationId, resumeMeta }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!resumeMeta) {
    return <p className="text-xs text-gray-400 italic">No resume attached to this application.</p>;
  }

  const handleAccess = async () => {
    setError(null);
    setPending(true);
    try {
      const result = await getResumeSignedUrlAction(applicationId);
      if ('error' in result) {
        setError(result.error);
      } else {
        // Open signed URL in a new tab — it is server-generated and short-lived
        window.open(result.url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setError('Resume download is temporarily unavailable.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Resume</h3>
      <p className="text-xs text-gray-500 mb-1">
        Status: {resumeMeta.status} · Completeness: {resumeMeta.completeness}
      </p>
      {error && (
        <p role="alert" className="text-xs text-red-600 mb-2">{error}</p>
      )}
      <button
        id="btn-resume-access"
        onClick={handleAccess}
        disabled={pending}
        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? 'Generating secure link…' : 'View Resume (Secure)'}
      </button>
      <p className="text-xs text-gray-400 mt-1">Link expires in 5 minutes.</p>
    </div>
  );
}
