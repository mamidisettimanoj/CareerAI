import React from 'react';
import { ApplicationService } from '@/domain/applications/service/ApplicationService';
import { PrismaClient } from '@prisma/client';
import { requireCareerUser } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, MapPin, Globe, ExternalLink, Calendar, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const prisma = new PrismaClient();
const applicationService = new ApplicationService(prisma);

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const user = await requireCareerUser();
  const profileId = user.profile?.id;
  if (!profileId) return <div>Profile required</div>;

  const app = await applicationService.getApplication(profileId, params.id);

  if (!app) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800">Application Not Found</h2>
        <p className="text-slate-500 mt-2">The application you are looking for does not exist or you do not have permission to view it.</p>
        <Link href="/applications" className="text-blue-600 mt-4 inline-block hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/applications" className="text-blue-600 hover:underline flex items-center gap-1 mb-4 text-sm font-medium">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{app.jobTitleSnapshot}</h1>
            <p className="text-xl text-slate-600 mt-1">{app.companySnapshot}</p>
          </div>
          <Badge className="text-sm px-3 py-1" variant={app.status === 'REJECTED' ? 'destructive' : app.status === 'OFFER' || app.status === 'ACCEPTED' ? 'default' : 'secondary'}>
            {app.status}
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Job Snapshot (Immutable)</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">Source</span>
                <span className="font-medium">{app.source}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Applied</span>
                <span className="font-medium flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" />
                  {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {app.locationSnapshot && (
                <div>
                  <span className="text-slate-500 block mb-1">Location</span>
                  <span className="font-medium flex items-center gap-1">
                    <MapPin size={14} className="text-slate-400" />
                    {app.locationSnapshot}
                  </span>
                </div>
              )}
              {app.employmentTypeSnapshot && (
                <div>
                  <span className="text-slate-500 block mb-1">Employment Type</span>
                  <span className="font-medium">{app.employmentTypeSnapshot}</span>
                </div>
              )}
              {app.sourceUrlSnapshot && (
                <div className="col-span-2">
                  <span className="text-slate-500 block mb-1">Original Posting</span>
                  <a href={app.sourceUrlSnapshot} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                    <ExternalLink size={14} /> View external listing
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold">Timeline</h3>
            </div>
            
            <div className="space-y-4">
              {app.events.length === 0 ? (
                <p className="text-slate-500 text-sm">No events recorded.</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 pl-4 space-y-6">
                  {app.events.map(event => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-6 top-1 bg-white border-2 border-blue-500 rounded-full w-4 h-4"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="mb-1">{event.newStatus}</Badge>
                          {event.note && <p className="text-sm text-slate-700 mt-2 bg-slate-50 p-2 rounded">{event.note}</p>}
                        </div>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(event.occurredAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Actions</h3>
            <p className="text-sm text-slate-500 mb-4">
              Status transitions are strictly validated. Select your next step carefully.
            </p>
            {/* Typically this would be a Client Component form calling the server action */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600 flex gap-2 items-center">
              <Clock size={16} className="text-amber-500 flex-shrink-0" />
              <span>Update functionality temporarily disabled in this view.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
