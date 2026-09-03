import React from 'react';
import { searchJobsAction } from '@/actions/jobs';
import { AlertTriangle, Search, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function JobsPage() {
  const result = await searchJobsAction({});

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Briefcase className="text-blue-600" /> CareerAI Job Matching</h1>
          <p className="text-muted-foreground mt-1">Discover opportunities matched deterministically against your verified skills.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border flex items-center gap-3">
        <Search className="text-slate-400" />
        <Input placeholder="Search by job title, skills, or company..." className="border-none shadow-none focus-visible:ring-0 flex-1" />
        <Button>Search Jobs</Button>
      </div>

      {!result.success || result.data?.status !== 'SUCCESS' ? (
        <div className="bg-red-50 text-red-700 p-8 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Live Job Source Configured</h2>
          <p className="max-w-md text-sm">
            {result.data?.error || result.error || 'The system is currently running in a closed environment without API credentials for external job boards.'}
          </p>
          <p className="text-xs font-semibold uppercase mt-6 text-red-500 tracking-wide">
            CareerAI explicitly forbids the hallucination of fake jobs.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* We would map jobs here, but the strict constraint forces NO_PROVIDER_CONFIGURED */}
        </div>
      )}
    </div>
  );
}
