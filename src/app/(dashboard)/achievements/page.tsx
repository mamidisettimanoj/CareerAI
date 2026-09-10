"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AchievementData } from '@/domain/portfolio/types/portfolio.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Calendar, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

export default function AchievementsCenter() {
  const achievements = useLiveQuery(() => db.achievements.toArray()) || [];
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<AchievementData>>({ category: 'Award' });

  const handleSave = async () => {
    if (!form.title || !form.date) {
      alert("Title and Date are required.");
      return;
    }

    await db.achievements.put({
      id: form.id || uuidv4(),
      title: form.title,
      description: form.description || '',
      date: form.date,
      category: form.category as any,
      organization: form.organization || '',
      position: form.position || '',
      evidenceUrl: form.evidenceUrl || '',
      skills: [],
      notes: form.notes || '',
      createdAt: form.id ? form.createdAt! : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setIsAdding(false);
    setForm({ category: 'Award' });
  };

  const handleDelete = async (id: string) => {
    await db.achievements.delete(id);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/portfolio">
          <Button variant="ghost" size="sm" className="px-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Portfolio</Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" /> Achievement Center
        </h1>
        <Button onClick={() => setIsAdding(!isAdding)}><PlusCircle className="h-4 w-4 mr-2" /> Add Achievement</Button>
      </div>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Add New Achievement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. 1st Place SIH Hackathon" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hackathon">Hackathon</SelectItem>
                    <SelectItem value="Coding Contest">Coding Contest</SelectItem>
                    <SelectItem value="Award">Award</SelectItem>
                    <SelectItem value="Publication">Publication</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                    <SelectItem value="Volunteering">Volunteering</SelectItem>
                    <SelectItem value="Club">Club</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Organization / Event Name</label>
                <Input value={form.organization || ''} onChange={e => setForm({...form, organization: e.target.value})} placeholder="e.g. AICTE" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} placeholder="What was this achievement for?" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Achievement</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {achievements.length === 0 && !isAdding ? (
          <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
            No achievements added yet. Click "Add Achievement" to stand out!
          </div>
        ) : (
          achievements.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(achievement => (
            <Card key={achievement.id}>
              <CardContent className="p-4 md:p-6 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{achievement.title}</h3>
                    <Badge variant="outline">{achievement.category}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {achievement.organization && <span>{achievement.organization}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(achievement.date).toLocaleDateString()}</span>
                  </div>
                  {achievement.description && <p className="text-sm mt-2">{achievement.description}</p>}
                </div>
                <div className="flex md:flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => { setForm(achievement); setIsAdding(true); }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(achievement.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
