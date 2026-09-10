"use client";

import { useState, useEffect, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ApplicationStatus } from '@/domain/placement/types/placement.types';
import { canTransition } from '@/domain/placement/engine/ApplicationStateMachine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Briefcase, Building, Calendar, CheckCircle2, FileText, Activity, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { repositories } from '@/services/ServiceLocator';

function ApplicationDetailContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');
  
  const application = useLiveQuery(() => db.applications.get(applicationId || ''), [applicationId]);
  const events = useLiveQuery(() => db.applicationEvents.where('applicationId').equals(applicationId || '').toArray(), [applicationId]) || [];
  const interviews = useLiveQuery(() => db.interviews.where('applicationId').equals(applicationId || '').toArray(), [applicationId]) || [];
  const router = useRouter();

  const [isAddingRound, setIsAddingRound] = useState(false);
  const [roundType, setRoundType] = useState<'HR' | 'TECHNICAL' | 'MANAGERIAL'>('TECHNICAL');
  const [roundDate, setRoundDate] = useState('');

  if (!applicationId) return <div className="p-8 text-center text-destructive">Invalid application ID.</div>;
  if (application === undefined) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (application === null) return <div className="p-8 text-center text-destructive">Application not found.</div>;

  const handleStatusChange = async (newStatus: ApplicationStatus | 'ACCEPTED') => {
    if (!canTransition(application.status, newStatus)) {
      alert(`Cannot transition from ${application.status} to ${newStatus}`);
      return;
    }

    if (newStatus === 'ACCEPTED') {
      await db.applications.update(applicationId, { status: 'ACCEPTED' });
      await db.offers.put({
        id: uuidv4(),
        applicationId,
        companyName: application.companyName,
        roleTitle: application.roleTitle,
        ctc: 0,
        base: 0,
        location: 'TBD',
        status: 'ACCEPTED'
      });
    } else {
      await db.applications.update(applicationId, { status: newStatus as ApplicationStatus });
    }

    await db.applicationEvents.put({
      id: uuidv4(),
      applicationId,
      date: new Date().toISOString(),
      type: 'STATE_CHANGE',
      oldState: application.status,
      newState: newStatus as ApplicationStatus,
      description: `Status changed to ${newStatus}`
    });
  };

  const handleAddInterview = async () => {
    if (!roundDate) return;
    
    await db.interviews.put({
      id: uuidv4(),
      applicationId,
      roundNumber: interviews.length + 1,
      type: roundType,
      date: new Date(roundDate).toISOString(),
      status: 'SCHEDULED'
    });

    await db.applicationEvents.put({
      id: uuidv4(),
      applicationId,
      date: new Date().toISOString(),
      type: 'ROUND_SCHEDULED',
      description: `${roundType} Round scheduled for ${new Date(roundDate).toLocaleDateString()}`
    });

    setIsAddingRound(false);
    setRoundDate('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/placement/applications">
          <Button variant="ghost" size="sm" className="px-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Pipeline</Button>
        </Link>
        <Button variant="destructive" size="sm" onClick={async () => {
          if (confirm("Are you sure you want to delete this application? All interviews, online tests, and offers associated with it will also be deleted.")) {
            await repositories.placement.deleteApplication(applicationId);
            router.push('/placement/applications');
          }
        }}>
          <Trash2 className="h-4 w-4 mr-1"/> Delete
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold">{application.companyName}</h1>
            <Badge variant="default" className="text-sm">{application.status}</Badge>
          </div>
          <p className="text-lg text-muted-foreground flex items-center gap-2"><Briefcase className="h-5 w-5" /> {application.roleTitle}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canTransition(application.status, 'APPLIED') && <Button size="sm" onClick={() => handleStatusChange('APPLIED')}>Mark Applied</Button>}
          {canTransition(application.status, 'ASSESSMENT') && <Button size="sm" onClick={() => handleStatusChange('ASSESSMENT')}>Online Test</Button>}
          {canTransition(application.status, 'INTERVIEWING') && <Button size="sm" onClick={() => handleStatusChange('INTERVIEWING')}>Interviewing</Button>}
          {canTransition(application.status, 'OFFERED') && <Button size="sm" className="bg-success text-success-foreground" onClick={() => handleStatusChange('OFFERED')}>Offer Received!</Button>}
          {canTransition(application.status, 'ACCEPTED') && <Button size="sm" className="bg-success text-success-foreground" onClick={() => handleStatusChange('ACCEPTED')}>Accept Offer</Button>}
          {canTransition(application.status, 'REJECTED') && <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => handleStatusChange('REJECTED')}>Rejected</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Details & Interviews */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" /> Interviews</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsAddingRound(!isAddingRound)}>+ Add Round</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {isAddingRound && (
                <div className="p-4 border rounded-lg bg-muted/20 space-y-3 mb-4">
                  <h4 className="font-semibold text-sm">Schedule New Round</h4>
                  <div className="flex gap-2">
                    <Select value={roundType} onValueChange={(val: any) => setRoundType(val)}>
                      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Round Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HR">HR Round</SelectItem>
                        <SelectItem value="TECHNICAL">Technical Round</SelectItem>
                        <SelectItem value="MANAGERIAL">Managerial Round</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="date" value={roundDate} onChange={e => setRoundDate(e.target.value)} />
                    <Button onClick={handleAddInterview}>Save</Button>
                  </div>
                </div>
              )}

              {interviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">No interviews scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {interviews.sort((a,b) => a.roundNumber - b.roundNumber).map((round) => (
                    <div key={round.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Round {round.roundNumber}: {round.type}</span>
                          <Badge variant="outline" className="text-[10px]">{round.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Scheduled for: {new Date(round.date).toLocaleDateString()}</p>
                      </div>
                      {round.status === 'SCHEDULED' && (
                        <Button size="sm" variant="ghost" className="text-success" onClick={async () => {
                          await db.interviews.update(round.id, { status: 'COMPLETED' });
                        }}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Done
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Timeline */}
        <div className="md:col-span-1">
          <Card className="h-full border-l-4 border-l-primary/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5" /> Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                {events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow" />
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border bg-card shadow-sm space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-primary">{event.type}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <ApplicationDetailContent />
    </Suspense>
  );
}
