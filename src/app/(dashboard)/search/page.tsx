"use client";

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Folder, Briefcase, Award, TerminalSquare, FileText, Target, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('');
  
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const skills = useLiveQuery(() => db.skills.toArray()) || [];
  const applications = useLiveQuery(() => db.applications.toArray()) || [];
  const internships = useLiveQuery(() => db.internships.toArray()) || [];
  const certifications = useLiveQuery(() => db.certifications.toArray()) || [];
  const goals = useLiveQuery(() => db.goals.toArray()) || [];

  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches: any[] = [];

    projects.forEach(p => {
      const titleStr = p.title || p.name || '';
      if (titleStr.toLowerCase().includes(lowerQuery) || (p.description && p.description.toLowerCase().includes(lowerQuery))) {
        matches.push({ id: `proj-${p.id}`, title: titleStr, category: 'Project', icon: <Folder className="h-4 w-4" />, link: '/projects' });
      }
    });

    skills.forEach(s => {
      if (s.name.toLowerCase().includes(lowerQuery)) {
        matches.push({ id: `skill-${s.name}`, title: s.name, category: 'Skill', icon: <TerminalSquare className="h-4 w-4" />, link: '/skills' });
      }
    });

    applications.forEach(a => {
      if (a.companyName.toLowerCase().includes(lowerQuery) || (a.roleTitle && a.roleTitle.toLowerCase().includes(lowerQuery))) {
        matches.push({ id: `app-${a.id}`, title: `${a.roleTitle || 'Role'} at ${a.companyName}`, category: 'Application', icon: <Briefcase className="h-4 w-4" />, link: '/placement/applications' });
      }
    });

    internships.forEach(i => {
      if (i.company.toLowerCase().includes(lowerQuery) || i.role.toLowerCase().includes(lowerQuery)) {
        matches.push({ id: `int-${i.id}`, title: `${i.role} at ${i.company}`, category: 'Internship', icon: <MapPin className="h-4 w-4" />, link: '/internships' });
      }
    });

    certifications.forEach(c => {
      if (c.name.toLowerCase().includes(lowerQuery) || c.provider.toLowerCase().includes(lowerQuery)) {
        matches.push({ id: `cert-${c.id}`, title: c.name, category: 'Certification', icon: <Award className="h-4 w-4" />, link: '/certifications' });
      }
    });

    goals.forEach(g => {
      if (g.title.toLowerCase().includes(lowerQuery)) {
        matches.push({ id: `goal-${g.id}`, title: g.title, category: 'Goal', icon: <Target className="h-4 w-4" />, link: '/goals' });
      }
    });

    setResults(matches);
  }, [query, projects, skills, applications, internships, certifications, goals]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="page-title">Global Search</h1>
        <p className="text-muted-foreground">Find anything in your local workspace instantly.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          placeholder="Search projects, skills, applications, goals..." 
          className="pl-10 py-6 text-lg rounded-xl shadow-sm"
          autoFocus
        />
      </div>

      {query.length >= 2 && (
        <div className="space-y-3 pt-4">
          <p className="text-sm font-medium text-muted-foreground">{results.length} results found</p>
          
          {results.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
              No matching records found in your local database.
            </div>
          ) : (
            results.map(res => (
              <Link key={res.id} href={res.link}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-3">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-md">
                        {res.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{res.title}</h3>
                        <p className="text-xs text-muted-foreground">{res.category}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
