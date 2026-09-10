"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { InternshipData } from '@/domain/portfolio/types/portfolio.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, Calendar, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

export default function InternshipsCenter() {
  const internships = useLiveQuery(() => db.internships.toArray()) || [];
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<InternshipData>>({ status: 'Ongoing', type: 'Full-time' });

  const handleSave = async () => {
    if (!form.company || !form.role || !form.startDate) {
      alert("Company, Role, and Start Date are required.");
      return;
    }

    await db.internships.put({
      id: form.id || uuidv4(),
      company: form.company,
      role: form.role,
      type: form.type as any,
      location: form.location || '',
      startDate: form.startDate,
      endDate: form.endDate || '',
      description: form.description || '',
      skills: [],
      achievements: [],
      status: form.status as any,
      createdAt: form.id ? form.createdAt! : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setIsAdding(false);
    setForm({ status: 'Ongoing', type: 'Full-time' });
  };

  const handleDelete = async (id: string) => {
    await db.internships.delete(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/portfolio">
          <Button variant="ghost" size="sm" className="px-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Portfolio</Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-orange-500" /> Internship Center
        </h1>
        <Button onClick={() => setIsAdding(!isAdding)}><PlusCircle className="h-4 w-4 mr-2" /> Add Internship</Button>
      </div>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Add New Internship</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Company *</label>
                <Input value={form.company || ''} onChange={e => setForm({...form, company: e.target.value})} placeholder="e.g. Google" />
              </div>
              <div>
                <label className="text-sm font-medium">Role *</label>
                <Input value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})} placeholder="e.g. Software Engineer Intern" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Start Date *</label>
                <Input type="date" value={form.startDate || ''} onChange={e => setForm({...form, startDate: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" value={form.endDate || ''} onChange={e => setForm({...form, endDate: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} placeholder="What did you do?" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Internship</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {internships.length === 0 && !isAdding ? (
          <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
            No internships added yet. Click "Add Internship" to start building your portfolio!
          </div>
        ) : (
          internships.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(internship => (
            <Card key={internship.id}>
              <CardContent className="p-4 md:p-6 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{internship.role}</h3>
                    <Badge variant={internship.status === 'Completed' ? 'default' : 'secondary'}>{internship.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {internship.company} ({internship.type})</span>
                    {internship.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {internship.location}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(internship.startDate).toLocaleDateString()} {internship.endDate ? `- ${new Date(internship.endDate).toLocaleDateString()}` : '- Present'}</span>
                  </div>
                  {internship.description && <p className="text-sm mt-2">{internship.description}</p>}
                </div>
                <div className="flex md:flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => { setForm(internship); setIsAdding(true); }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(internship.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
