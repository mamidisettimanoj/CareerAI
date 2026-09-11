"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, HardDrive, Palette } from 'lucide-react';
import Link from 'next/link';
import { appService } from '@/services/AppService';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();

  const handleLoadDemo = async () => {
    await appService.loadDemoProfile();
    toast({
      title: "Demo Data Loaded",
      description: "Fictional profile data has been loaded into your workspace.",
      variant: "default",
    });
    setTimeout(() => window.location.href = '/dashboard', 1000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="page-title">Settings & Preferences</h1>
        <p className="text-muted-foreground mt-1">Manage your local workspace, data backups, and privacy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Link href="/settings/backup" className="block h-full">
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors"><HardDrive className="h-5 w-5"/> Backup Center</CardTitle>
              <CardDescription>Export your workspace to JSON, restore from a backup, and verify data integrity.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/privacy" className="block h-full">
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors"><Shield className="h-5 w-5"/> Privacy Center</CardTitle>
              <CardDescription>Review local storage explanations and permanently wipe your data.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5"/> Developer / Demo</CardTitle>
            <CardDescription>Load dummy data to test the dashboard UI.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLoadDemo} variant="outline" className="text-primary hover:text-primary hover:bg-primary/10 border-primary/20">
              Load Demo Profile
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Warning: This will overwrite your existing data.</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}


