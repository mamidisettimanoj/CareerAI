'use client';

import { useState } from 'react';
import { createRecruiterJobAction } from '@/actions/recruitment';

interface Props {
  onCreated?: () => void;
}

export function CreateJobForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [remoteType, setRemoteType] = useState('');
  const [requiredSkillsRaw, setRequiredSkillsRaw] = useState('');
  const [preferredSkillsRaw, setPreferredSkillsRaw] = useState('');
  const [expMin, setExpMin] = useState('');
  const [expMax, setExpMax] = useState('');

  const reset = () => {
    setTitle(''); setDescription(''); setLocation(''); setEmploymentType('');
    setRemoteType(''); setRequiredSkillsRaw(''); setPreferredSkillsRaw('');
    setExpMin(''); setExpMax(''); setError(null); setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) { setError('Title is required.'); return; }
    if (!description.trim()) { setError('Description is required.'); return; }

    setPending(true);
    try {
      await createRecruiterJobAction({
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || undefined,
        employmentType: employmentType || undefined,
        remoteType: remoteType || undefined,
        requiredSkills: requiredSkillsRaw.split(',').map(s => s.trim()).filter(Boolean),
        preferredSkills: preferredSkillsRaw.split(',').map(s => s.trim()).filter(Boolean),
        experienceMin: expMin ? parseInt(expMin) : undefined,
        experienceMax: expMax ? parseInt(expMax) : undefined,
      });
      setSuccess('Job created as DRAFT. You can now publish it from the jobs list.');
      reset();
      onCreated?.();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create job.');
    } finally {
      setPending(false);
    }
  };

  if (!open) {
    return (
      <button
        id="btn-post-new-job"
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
      >
        Post New Job
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Post New Job</h2>
          <button onClick={() => { setOpen(false); reset(); }} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">{error}</div>}
          {success && <div role="status" className="bg-green-50 text-green-700 border border-green-200 rounded p-3 text-sm">{success}</div>}

          <div>
            <label htmlFor="job-title" className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
            <input id="job-title" type="text" value={title} onChange={e => setTitle(e.target.value)}
              maxLength={200} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Software Engineer" />
          </div>

          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea id="job-description" value={description} onChange={e => setDescription(e.target.value)}
              rows={5} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Job responsibilities, requirements, and details..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="job-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input id="job-location" type="text" value={location} onChange={e => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Bengaluru, India" />
            </div>
            <div>
              <label htmlFor="job-employment-type" className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <select id="job-employment-type" value={employmentType} onChange={e => setEmploymentType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select...</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="job-remote-type" className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
              <select id="job-remote-type" value={remoteType} onChange={e => setRemoteType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select...</option>
                <option value="ONSITE">On-site</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="job-exp-min" className="block text-sm font-medium text-gray-700 mb-1">Exp Min (yrs)</label>
                <input id="job-exp-min" type="number" min="0" max="30" value={expMin} onChange={e => setExpMin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="job-exp-max" className="block text-sm font-medium text-gray-700 mb-1">Exp Max (yrs)</label>
                <input id="job-exp-max" type="number" min="0" max="50" value={expMax} onChange={e => setExpMax(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="job-required-skills" className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
            <input id="job-required-skills" type="text" value={requiredSkillsRaw} onChange={e => setRequiredSkillsRaw(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. React, Node.js, PostgreSQL" />
          </div>

          <div>
            <label htmlFor="job-preferred-skills" className="block text-sm font-medium text-gray-700 mb-1">Preferred Skills (comma-separated)</label>
            <input id="job-preferred-skills" type="text" value={preferredSkillsRaw} onChange={e => setPreferredSkillsRaw(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. TypeScript, Docker" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={pending}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50">
              {pending ? 'Creating…' : 'Create as Draft'}
            </button>
            <button type="button" onClick={() => { setOpen(false); reset(); }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
