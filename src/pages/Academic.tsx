import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadData, saveData } from '@/lib/storage';
import { SemesterData, AppState } from '@/types';
import { Trash2, Plus, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Academic() {
  const { toast } = useToast();
  const [data, setData] = useState<AppState | null>(null);
  
  const [newSemName, setNewSemName] = useState('');
  const [newSemSgpa, setNewSemSgpa] = useState('');
  const [newSemCredits, setNewSemCredits] = useState('');

  useEffect(() => {
    setData(loadData());
  }, []);

  if (!data) return null;

  const handleAddSemester = () => {
    const sgpa = parseFloat(newSemSgpa);
    const credits = parseFloat(newSemCredits);
    
    if (!newSemName || isNaN(sgpa) || isNaN(credits) || sgpa > 10 || sgpa < 0) {
      toast({
        title: "Invalid Input",
        description: "Please check your semester data values.",
        variant: "destructive"
      });
      return;
    }

    const newSem: SemesterData = {
      id: Date.now().toString(),
      name: newSemName,
      sgpa,
      credits
    };

    const updatedSemesters = [...data.semesters, newSem];
    
    // Sort logic could go here based on name, assuming simple sequential input for now.
    
    saveData({ semesters: updatedSemesters });
    setData({ ...data, semesters: updatedSemesters });
    
    setNewSemName('');
    setNewSemSgpa('');
    setNewSemCredits('');
    
    toast({
      title: "Semester Added",
      description: "Your academic record has been updated."
    });
  };

  const handleDelete = (id: string) => {
    const updatedSemesters = data.semesters.filter(s => s.id !== id);
    saveData({ semesters: updatedSemesters });
    setData({ ...data, semesters: updatedSemesters });
  };

  // Calculate overall CGPA from semesters
  let totalCredits = 0;
  let totalGradePoints = 0;
  data.semesters.forEach(sem => {
    totalCredits += sem.credits;
    totalGradePoints += (sem.sgpa * sem.credits);
  });
  const calculatedCgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : "N/A";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold">Academic Tracker</h1>
        <p className="text-muted-foreground">Manage your semester records and calculate overall CGPA.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Aggregate Card */}
        <Card className="glass-panel md:col-span-1 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Aggregate CGPA</CardTitle>
            <CardDescription>Based on entered semesters</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="h-32 w-32 rounded-full border-8 border-primary flex items-center justify-center mb-4 relative shadow-[0_0_15px_rgba(67,97,238,0.3)]">
              <span className="text-4xl font-bold">{calculatedCgpa}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Total Credits: <span className="font-bold text-foreground">{totalCredits}</span>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {/* Add Semester Form */}
          <Card className="glass-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Add Semester Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2 flex-1 min-w-[150px]">
                  <Label>Semester Name</Label>
                  <Input value={newSemName} onChange={e => setNewSemName(e.target.value)} placeholder="E.g. Sem 1" />
                </div>
                <div className="space-y-2 w-24">
                  <Label>SGPA</Label>
                  <Input type="number" step="0.01" max="10" value={newSemSgpa} onChange={e => setNewSemSgpa(e.target.value)} placeholder="8.5" />
                </div>
                <div className="space-y-2 w-24">
                  <Label>Credits</Label>
                  <Input type="number" value={newSemCredits} onChange={e => setNewSemCredits(e.target.value)} placeholder="22" />
                </div>
                <Button onClick={handleAddSemester} className="bg-primary">Add</Button>
              </div>
            </CardContent>
          </Card>

          {/* Semesters List */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">Semester History</CardTitle>
            </CardHeader>
            <CardContent>
              {data.semesters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-lg">
                  No semesters added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.semesters.map((sem) => (
                    <div key={sem.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                      <div>
                        <div className="font-medium">{sem.name}</div>
                        <div className="text-xs text-muted-foreground">Credits: {sem.credits}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-primary">{sem.sgpa.toFixed(2)}</div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(sem.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
