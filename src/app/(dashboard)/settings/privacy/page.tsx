"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ServerOff, DatabaseZap, Lock, EyeOff } from 'lucide-react';
import { appService } from '@/services/AppService';
import { useToast } from '@/hooks/use-toast';

export default function PrivacyCenter() {
  const { toast } = useToast();

  const handleClearData = async () => {
    if (confirm("Are you sure you want to delete all local data? This action CANNOT BE UNDONE and will wipe your entire workspace.")) {
      await appService.clearData();
      toast({
        title: "Workspace Reset",
        description: "All your local data has been permanently deleted.",
        variant: "destructive",
      });
      setTimeout(() => window.location.href = '/', 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary"/> Privacy Center</h1>
        <p className="text-muted-foreground mt-1">Understand your data footprint and maintain complete control.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="space-y-6 md:col-span-1">
          <Card className="h-full bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><ServerOff className="h-5 w-5"/> 100% Client-Side</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                CareerAI is built on a "Local-First" architecture. This means <strong>absolutely zero</strong> personal data is sent to an external server or database. 
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2 items-start"><DatabaseZap className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5"/> <span><strong>No Cloud Databases:</strong> We don't use Postgres, Supabase, or Firebase.</span></li>
                <li className="flex gap-2 items-start"><Lock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5"/> <span><strong>No Accounts:</strong> You don't need a username or password.</span></li>
                <li className="flex gap-2 items-start"><EyeOff className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5"/> <span><strong>No Tracking:</strong> There are no external tracking pixels or telemetry.</span></li>
              </ul>
              <p className="text-xs text-muted-foreground bg-background p-3 rounded border">
                Your data is stored exclusively in your browser's IndexedDB. If you clear your browser cache without taking a backup, your data will be permanently lost.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Storage Inspector</CardTitle>
              <CardDescription>A summary of what is currently stored in your browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                CareerAI uses <strong>IndexedDB (v8)</strong> to persist 15 distinct modules including profiles, academic records, algorithms, and application logs.
              </p>
              <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono break-all">
                Storage: local (IndexedDB)<br/>
                Limits: Subject to browser quotas.<br/>
                Encryption: Native OS disk encryption.
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Permanently wipe all records from this browser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">This action immediately drops the entire IndexedDB database. It cannot be recovered unless you have a JSON backup file.</p>
              <Button onClick={handleClearData} variant="destructive" className="w-full">
                Delete My Data & Reset App
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
