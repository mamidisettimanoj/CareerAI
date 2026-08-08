import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadData, saveData, loadDemoProfile, clearData, exportData } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { AppState } from '@/types';

export function Settings() {
  const { toast } = useToast();
  const [data, setData] = useState<AppState | null>(null);

  useEffect(() => {
    setData(loadData());
  }, []);

  const handleLoadDemo = () => {
    loadDemoProfile();
    setData(loadData());
    toast({
      title: "Demo Data Loaded",
      description: "Fictional profile data has been loaded into your workspace.",
      variant: "default",
    });
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to delete all local data? This cannot be undone.")) {
      clearData();
      setData(loadData());
      toast({
        title: "Data Cleared",
        description: "All your local data has been removed.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    exportData();
    toast({
      title: "Export Successful",
      description: "Your data has been downloaded as a JSON file.",
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-heading font-bold">Settings & Data Management</h1>
        <p className="text-muted-foreground">Manage your local profile data and application preferences.</p>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" className="space-y-4 mt-4">
          <Card className="glass-panel border-accent/20">
            <CardHeader>
              <CardTitle>Demo Mode</CardTitle>
              <CardDescription>
                Load fictional data to see how the dashboard and analytics look when fully populated. 
                This will overwrite your current profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLoadDemo} variant="outline" className="text-accent hover:text-accent hover:bg-accent/10">
                Load Demo Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Export / Import</CardTitle>
              <CardDescription>
                Download a backup of your data or restore from a previous JSON export.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button onClick={handleExport}>Export Data (JSON)</Button>
              {/* Import would require a file input, omitting for brevity but standard HTML input works */}
              <Button variant="secondary" disabled>Import Data (Coming Soon)</Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete all data stored in your browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleClearData} variant="destructive">
                Clear All Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Currently locked to Dark Glassmorphism theme to ensure optimal UI experience.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Privacy Notice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Local Storage Only:</strong> CareerAI is a client-side application. All your academic records, scores, and personal data remain securely inside your browser's LocalStorage. We do not transmit your profile to any external servers.
              </p>
              <p>
                <strong>Resume Analysis:</strong> The resume parsing tool processes PDF files locally using your device's computational power via pdf.js. No files are uploaded to the cloud.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
