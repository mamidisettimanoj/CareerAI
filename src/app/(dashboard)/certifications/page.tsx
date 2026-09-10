"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CertificationData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Calendar, Trash2, PlusCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

export default function CertificationsCenter() {
  const certifications = useLiveQuery(() => db.certifications.toArray()) || [];
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<CertificationData>>({ category: 'Technical', status: 'Active' });

  const handleSave = async () => {
    if (!form.name || !form.provider || !form.issueDate) {
      alert("Name, Provider, and Issue Date are required.");
      return;
    }

    await db.certifications.put({
      id: form.id || uuidv4(),
      name: form.name,
      provider: form.provider,
      issueDate: form.issueDate,
      expiryDate: form.expiryDate || undefined,
      credentialId: form.credentialId || '',
      credentialUrl: form.credentialUrl || '',
      category: form.category as any,
      skills: [],
      status: form.status as any,
      notes: form.notes || '',
      createdAt: form.id ? form.createdAt! : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setIsAdding(false);
    setForm({ category: 'Technical', status: 'Active' });
  };

  const handleDelete = async (id: string) => {
    await db.certifications.delete(id);
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
          <Award className="h-6 w-6 text-green-500" /> Certification Center
        </h1>
        <Button onClick={() => setIsAdding(!isAdding)}><PlusCircle className="h-4 w-4 mr-2" /> Add Certification</Button>
      </div>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Add New Certification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Certification Name *</label>
                <Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. AWS Solutions Architect" />
              </div>
              <div>
                <label className="text-sm font-medium">Provider *</label>
                <Input value={form.provider || ''} onChange={e => setForm({...form, provider: e.target.value})} placeholder="e.g. Amazon Web Services" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="No Expiry">No Expiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Issue Date *</label>
                <Input type="date" value={form.issueDate || form.date || ''} onChange={e => setForm({...form, issueDate: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <Input type="date" value={form.expiryDate || ''} onChange={e => setForm({...form, expiryDate: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Credential URL</label>
                <Input value={form.credentialUrl || ''} onChange={e => setForm({...form, credentialUrl: e.target.value})} placeholder="Link to verify certification" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Certification</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {certifications.length === 0 && !isAdding ? (
          <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
            No certifications added yet. Click "Add Certification" to show off your credentials!
          </div>
        ) : (
          certifications.sort((a,b) => new Date(b.issueDate || b.date || '').getTime() - new Date(a.issueDate || a.date || '').getTime()).map(cert => {
            const isExpiringSoon = cert.status === 'Active' && cert.expiryDate && (new Date(cert.expiryDate).getTime() - Date.now()) < (30 * 24 * 60 * 60 * 1000);
            return (
              <Card key={cert.id} className={isExpiringSoon ? 'border-yellow-500/50' : ''}>
                <CardContent className="p-4 md:p-6 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{cert.name}</h3>
                      <Badge variant={cert.status === 'Active' ? 'default' : cert.status === 'No Expiry' ? 'secondary' : 'destructive'}>{cert.status}</Badge>
                      {isExpiringSoon && <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50"><AlertTriangle className="w-3 h-3 mr-1" /> Expiring Soon</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{cert.provider}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Issued: {new Date(cert.issueDate || cert.date || '').toLocaleDateString()}</span>
                      {cert.expiryDate && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>}
                    </div>
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-block mt-2">
                        Verify Credential
                      </a>
                    )}
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => { setForm(cert); setIsAdding(true); }}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(cert.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
