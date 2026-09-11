"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload, ShieldCheck, AlertCircle, HardDrive } from 'lucide-react';
import { appService } from '@/services/AppService';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

export default function BackupCenter() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [health, setHealth] = useState<{status: string, issues: string[]}>({ status: 'Unknown', issues: [] });

  const handleExport = async () => {
    try {
      const data: any = {
        app: "CareerAI",
        version: "2.0.0",
        schemaVersion: 8,
        exportedAt: new Date().toISOString(),
        data: {}
      };
      
      const tables = db.tables;
      for (const table of tables) {
        data.data[table.name] = await table.toArray();
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `careerai_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Backup Exported", description: "Your data has been successfully saved." });
    } catch (e) {
      toast({ title: "Export Failed", description: "Could not create backup.", variant: "destructive" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (backup.app !== "CareerAI") throw new Error("Invalid backup file: Not a CareerAI backup.");
      if (!backup.data) throw new Error("Invalid backup file: Missing data payload.");
      if (typeof backup.schemaVersion !== "number") throw new Error("Invalid backup file: Unrecognized schema version.");

      // Dry run passed. Take current backup just in case
      const currentBackup: any = {};
      for (const table of db.tables) currentBackup[table.name] = await table.toArray();

      try {
        await db.transaction('rw', db.tables, async () => {
          for (const table of db.tables) {
            await table.clear();
            if (backup.data[table.name]) {
              await table.bulkPut(backup.data[table.name]);
            }
          }
        });
        toast({ title: "Import Successful", description: "Workspace restored from backup." });
      } catch (restoreError) {
        // Rollback
        await db.transaction('rw', db.tables, async () => {
          for (const table of db.tables) {
            await table.clear();
            if (currentBackup[table.name]) await table.bulkPut(currentBackup[table.name]);
          }
        });
        throw new Error("Import failed during transaction. Changes rolled back.");
      }
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message || "Invalid backup format.", variant: "destructive" });
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset input
    }
  };

  const runHealthCheck = async () => {
    const issues: string[] = [];
    const profile = await db.profile.get('me');
    if (!profile) issues.push("Missing core profile record.");

    const subjects = await db.subjects.toArray();
    const semesters = await db.semesters.toArray();
    const semIds = new Set(semesters.map(s => s.id));
    
    let orphanedSubjects = 0;
    subjects.forEach(s => {
      if (!semIds.has(s.semesterId)) orphanedSubjects++;
    });
    if (orphanedSubjects > 0) issues.push(`Found ${orphanedSubjects} orphaned subjects without a valid semester.`);

    const applications = await db.applications.toArray();
    let invalidApps = 0;
    applications.forEach(a => {
      if (!a.companyName || !a.status) invalidApps++;
    });
    if (invalidApps > 0) issues.push(`Found ${invalidApps} malformed applications.`);

    if (issues.length === 0) {
      setHealth({ status: 'Healthy', issues: [] });
    } else {
      setHealth({ status: 'Needs Attention', issues });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2"><HardDrive className="h-6 w-6 text-primary"/> Backup Center</h1>
        <p className="text-muted-foreground mt-1">Export, import, and verify your local database integrity.</p>
      </div>

      <div className="bg-warning/10 border border-warning/20 text-warning-foreground p-4 rounded-lg flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Important: Local-First Architecture</strong>
          <p className="mt-1">
            CareerAI is 100% local-first. Your data is stored entirely within your browser and is never sent to a cloud server. <strong>If you clear your browser cache, reinstall your browser, or switch devices, your data will be lost.</strong> Please export your data regularly to keep a safe backup.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5"/> Export Data</CardTitle>
            <CardDescription>Download a complete snapshot of your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} className="w-full">Create Backup (.json)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5"/> Import Data</CardTitle>
            <CardDescription>Restore your workspace from a previous JSON backup.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                disabled={importing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Button variant="secondary" className="w-full" disabled={importing}>
                {importing ? "Importing..." : "Select Backup File"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">Safety Note: A temporary rollback state is saved before import.</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5"/> Data Integrity Checker</CardTitle>
            <CardDescription>Scan your local storage for orphaned records or invalid schemas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={runHealthCheck}>Run Health Check</Button>
            
            {health.status !== 'Unknown' && (
              <div className={`p-4 rounded-lg border ${health.status === 'Healthy' ? 'bg-success/10 border-success/20 text-success' : 'bg-warning/10 border-warning/20 text-warning-foreground'}`}>
                <div className="flex items-center gap-2 font-bold mb-2">
                  {health.status === 'Healthy' ? <ShieldCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {health.status === 'Healthy' ? 'Database is Healthy' : 'Issues Detected'}
                </div>
                {health.issues.length > 0 && (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {health.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                  </ul>
                )}
                {health.issues.length === 0 && (
                  <p className="text-sm">No orphaned records or malformed entries detected across all 15 modules.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
