'use client';

import { useState } from 'react';
import { changeRecruitmentStageAction, addRecruiterNoteAction } from '@/actions/recruitment';

const STAGE_ORDER = [
  'RECEIVED', 'REVIEWING', 'SHORTLISTED', 'ASSESSMENT',
  'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'
] as const;

const TERMINAL_STAGES = new Set(['HIRED', 'REJECTED', 'WITHDRAWN']);

const STAGE_TRANSITIONS: Record<string, string[]> = {
  RECEIVED:   ['REVIEWING', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  REVIEWING:  ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED:['ASSESSMENT', 'INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  ASSESSMENT: ['INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW:  ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER:      ['HIRED', 'REJECTED', 'WITHDRAWN'],
  HIRED:      [],
  REJECTED:   [],
  WITHDRAWN:  [],
};

interface Props {
  applicationId: string;
  currentStage: string;
  currentVersion: number;
}

export function CandidateActions({ applicationId, currentStage, currentVersion }: Props) {
  const [stage, setStage] = useState(currentStage);
  const [version, setVersion] = useState(currentVersion);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageNote, setStageNote] = useState('');

  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [notePending, setNotePending] = useState(false);

  const validNextStages = STAGE_TRANSITIONS[stage] ?? [];
  const isTerminal = TERMINAL_STAGES.has(stage);

  const handleStageChange = async (newStage: string) => {
    setError(null);
    setPending(true);
    try {
      const result = await changeRecruitmentStageAction(
        applicationId,
        newStage as any,
        version,
        stageNote.trim() || undefined
      );
      if (result) {
        setStage(newStage);
        setVersion(version + 1);
        setStageNote('');
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Stage update failed.';
      if (msg.includes('updated by another')) {
        setError('This record was updated by another session. Please refresh the page.');
      } else {
        setError(msg);
      }
    } finally {
      setPending(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError(null);
    setNoteSuccess(false);
    if (!note.trim()) { setNoteError('Note cannot be empty.'); return; }
    setNotePending(true);
    try {
      await addRecruiterNoteAction(applicationId, note.trim());
      setNote('');
      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 3000);
    } catch (err: any) {
      setNoteError(err?.message ?? 'Failed to add note.');
    } finally {
      setNotePending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Change Panel */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Recruitment Stage</h3>
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
            Current: {stage}
          </span>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm mb-4">{error}</div>
        )}

        {isTerminal ? (
          <p className="text-sm text-gray-400 italic">Stage is terminal — no further transitions are possible.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="stage-note" className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input id="stage-note" type="text" value={stageNote} onChange={e => setStageNote(e.target.value)}
                maxLength={500}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reason for stage change..." />
            </div>
            <div className="flex flex-wrap gap-2">
              {validNextStages.map(nextStage => {
                const isDanger = nextStage === 'REJECTED' || nextStage === 'WITHDRAWN';
                const isPositive = nextStage === 'HIRED' || nextStage === 'OFFER';
                return (
                  <button
                    key={nextStage}
                    id={`btn-stage-${nextStage.toLowerCase()}`}
                    disabled={pending}
                    onClick={() => handleStageChange(nextStage)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 transition-colors ${
                      isDanger ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                      isPositive ? 'bg-green-600 text-white hover:bg-green-700' :
                      'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {pending ? '…' : `→ ${nextStage}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Note Panel */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Add Recruiter Note</h3>
        {noteError && <div role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm mb-3">{noteError}</div>}
        {noteSuccess && <div role="status" className="bg-green-50 text-green-700 border border-green-200 rounded p-3 text-sm mb-3">Note added.</div>}
        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            id="recruiter-note-content"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            maxLength={5000}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a private recruiter note (visible only to your team)..."
          />
          <button type="submit" disabled={notePending}
            className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
            {notePending ? 'Adding…' : 'Add Note'}
          </button>
        </form>
      </div>
    </div>
  );
}
