"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ResumeVersion } from '@/domain/portfolio/types/portfolio.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Save, FilePlus2, Eye, LayoutTemplate, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function ResumeStudio() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const resumeVersions = useLiveQuery(() => db.resumeVersions.toArray()) || [];
  
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  const activeVersion = resumeVersions.find(v => v.id === activeVersionId);

  const handleCreateNew = async () => {
    const newVersion: ResumeVersion = {
      id: uuidv4(),
      name: `Resume Version ${resumeVersions.length + 1}`,
      targetRole: profile?.targetRole || 'Software Engineer',
      sections: [
        { id: uuidv4(), type: 'Personal', isVisible: true, order: 1 },
        { id: uuidv4(), type: 'Summary', isVisible: true, order: 2 },
        { id: uuidv4(), type: 'Education', isVisible: true, order: 3 },
        { id: uuidv4(), type: 'Skills', isVisible: true, order: 4 },
        { id: uuidv4(), type: 'Projects', isVisible: true, order: 5 },
        { id: uuidv4(), type: 'Internships', isVisible: true, order: 6 },
        { id: uuidv4(), type: 'Certifications', isVisible: true, order: 7 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.resumeVersions.put(newVersion);
    setActiveVersionId(newVersion.id);
  };

  const handleDelete = async (id: string) => {
    await db.resumeVersions.delete(id);
    if (activeVersionId === id) setActiveVersionId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Hide controls when printing */}
      <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Resume Studio
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Build, manage, and print ATS-friendly resumes.</p>
        </div>
        <div className="flex gap-2">
          {activeVersion && <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2"/> Print / PDF</Button>}
          <Button onClick={handleCreateNew}><FilePlus2 className="h-4 w-4 mr-2"/> New Version</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar: Resume Versions & Settings */}
        <div className="print:hidden md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Resumes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {resumeVersions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No resumes yet.</p>
              ) : (
                resumeVersions.map(v => (
                  <div key={v.id} className={`flex justify-between items-center p-2 rounded-md cursor-pointer border ${activeVersionId === v.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`} onClick={() => setActiveVersionId(v.id)}>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate">{v.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{v.targetRole}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {activeVersion && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><LayoutTemplate className="h-4 w-4"/> Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeVersion.sections.sort((a,b) => a.order - b.order).map(section => (
                  <div key={section.id} className="flex justify-between items-center text-sm border p-2 rounded bg-background">
                    <span>{section.type}</span>
                    <Button variant="ghost" size="sm" className="h-5 p-1" onClick={async () => {
                      const updated = { ...activeVersion, sections: activeVersion.sections.map(s => s.id === section.id ? { ...s, isVisible: !s.isVisible } : s) };
                      await db.resumeVersions.put(updated);
                    }}>
                      {section.isVisible ? <Eye className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-muted-foreground opacity-50" />}
                    </Button>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground text-center pt-2">Drag to reorder (Coming soon)</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Editor/Preview Pane */}
        <div className="md:col-span-3">
          {activeVersion ? (
            <div className="bg-white text-black min-h-[1056px] w-full max-w-[816px] mx-auto shadow-lg print:shadow-none p-8 sm:p-12 border print:border-none print:p-0 resume-document">
              
              {/* Personal Info */}
              {activeVersion.sections.find(s => s.type === 'Personal')?.isVisible && (
                <div className="text-center border-b pb-4 mb-4">
                  <h1 className="text-3xl font-serif font-bold tracking-tight uppercase">{profile?.personal?.name || 'Your Name'}</h1>
                  <p className="text-sm mt-1 space-x-2 text-gray-600">
                    {profile?.personal?.email && <span>{profile.personal.email}</span>}
                    {profile?.personal?.phone && <span>| {profile.personal.phone}</span>}
                    {profile?.personal?.location && <span>| {profile.personal.location}</span>}
                  </p>
                  <p className="text-sm space-x-2 text-gray-600 mt-1">
                    {profile?.links?.linkedin && <a href={profile.links.linkedin} className="hover:underline">LinkedIn</a>}
                    {profile?.links?.github && <span>| <a href={profile.links.github} className="hover:underline">GitHub</a></span>}
                    {profile?.links?.portfolio && <span>| <a href={profile.links.portfolio} className="hover:underline">Portfolio</a></span>}
                  </p>
                </div>
              )}

              {/* Education */}
              {activeVersion.sections.find(s => s.type === 'Education')?.isVisible && (
                <div className="mb-4">
                  <h2 className="text-lg font-bold border-b border-black mb-2 uppercase tracking-wide">Education</h2>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{profile?.degree?.college || 'Your University'}</h3>
                      <p className="text-sm">{profile?.degree?.type || 'B.Tech'} in {profile?.degree?.branch || 'Computer Science'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">Graduation: {profile?.degree?.graduationYear || '2024'}</p>
                      <p className="text-sm">CGPA: {profile?.degree?.cgpa || '0.0'}/10</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 text-center text-sm text-gray-400 print:hidden">
                [Resume Preview: Content is dynamically injected from your CareerAI Portfolio during PDF generation.]
                <br/>
                Make sure your Projects, Internships, and Skills are updated in the dashboard!
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-lg text-muted-foreground print:hidden">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p>Select or create a resume version to get started.</p>
            </div>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .resume-document, .resume-document * {
            visibility: visible;
          }
          .resume-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}} />
    </div>
  );
}
