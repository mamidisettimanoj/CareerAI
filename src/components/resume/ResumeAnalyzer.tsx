"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Upload, CheckCircle2, XCircle, AlertTriangle, Trash2, FileUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { uploadResumeAction, deleteResumeAction } from '@/actions/resume';
import { useToast } from '@/hooks/use-toast';

export function ResumeAnalyzer({ initialResume }: { initialResume?: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
      await uploadResumeAction(formData);
      toast({ title: 'Resume uploaded successfully!' });
      setFile(null);
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialResume) return;
    setDeleting(true);
    try {
      await deleteResumeAction(initialResume.id);
      toast({ title: 'Resume deleted.' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const intel = initialResume?.intelligence;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold">Resume Intelligence</h1>
        <p className="text-muted-foreground">Upload your resume to evaluate completeness and track evidence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Card */}
        <Card >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" /> Upload Resume
            </CardTitle>
            <CardDescription>
              Upload your latest resume (PDF format, max 5MB).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {initialResume ? (
              <div className="flex flex-col items-center justify-center p-6 border border-border/50 rounded-lg bg-card/50 text-center">
                <FileText className="h-10 w-10 text-primary mb-3" />
                <h3 className="font-semibold text-lg">{initialResume.filename}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Last uploaded: {new Date(initialResume.lastParsed).toLocaleDateString()}
                </p>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : <><Trash2 className="h-4 w-4 mr-2" /> Delete Resume</>}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="resume-file">Select PDF File</Label>
                  <input 
                    id="resume-file" 
                    type="file" 
                    accept="application/pdf"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button onClick={handleUpload} className="w-full" disabled={!file || uploading}>
                  {uploading ? 'Uploading...' : <><Upload className="mr-2 h-4 w-4" /> Upload & Analyze</>}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground w-full text-center">
              Files are securely stored and analyzed deterministically.
            </p>
          </CardFooter>
        </Card>

        {/* Results Card */}
        <Card >
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>Deterministic completeness and quality scoring</CardDescription>
          </CardHeader>
          <CardContent>
            {!intel ? (
              <div className="h-full min-h-[300px] flex items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-lg p-6 text-center">
                Upload a resume to see deterministic intelligence results.
              </div>
            ) : (
              <div className="space-y-6">
                
                <div className="flex flex-col items-center justify-center p-4 bg-card/50 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground mb-1">Quality Score</span>
                  <div className={`text-4xl font-bold ${intel.qualityScore >= 80 ? 'text-success' : intel.qualityScore >= 60 ? 'text-gold' : 'text-destructive'}`}>
                    {intel.qualityScore}%
                  </div>
                  <Progress value={intel.qualityScore} className="h-2 w-full mt-3 max-w-[200px]" />
                  <div className="mt-2 text-xs text-muted-foreground font-medium">
                    STATUS: {intel.status} | COMPLETENESS: {intel.completeness}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">Section Detection</h4>
                  {Object.entries(intel.sections).map(([name, found]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{name}</span>
                      {found ? <CheckCircle2 className="text-success h-5 w-5" /> : <XCircle className="text-destructive h-5 w-5" />}
                    </div>
                  ))}
                </div>

                {intel.warnings?.length > 0 && (
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-gold" /> Analysis Warnings
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {intel.warnings.map((warn: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          {warn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
