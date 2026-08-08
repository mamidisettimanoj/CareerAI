import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Search, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function Resume() {
  const [resumeText, setResumeText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    sections: { name: string; found: boolean }[];
    missingKeywords: string[];
  } | null>(null);

  const analyzeResume = () => {
    if (!resumeText.trim()) return;

    const text = resumeText.toLowerCase();
    
    const sections = [
      { name: 'Education', keywords: ['education', 'university', 'college', 'b.tech', 'bachelor', 'degree'] },
      { name: 'Experience', keywords: ['experience', 'work', 'internship', 'employment'] },
      { name: 'Projects', keywords: ['projects', 'academic projects', 'personal projects'] },
      { name: 'Skills', keywords: ['skills', 'technologies', 'technical skills', 'tools'] },
      { name: 'Contact Info', keywords: ['email', 'phone', 'github', 'linkedin', '.com', '@'] }
    ];

    const foundSections = sections.map(sec => ({
      name: sec.name,
      found: sec.keywords.some(kw => text.includes(kw))
    }));

    const score = Math.round((foundSections.filter(s => s.found).length / sections.length) * 100);

    // Basic technical keyword check
    const techKeywords = ['react', 'python', 'java', 'sql', 'javascript', 'c++', 'aws', 'docker', 'git', 'api'];
    const missing = techKeywords.filter(kw => !text.includes(kw));

    setResults({
      score,
      sections: foundSections,
      missingKeywords: missing.slice(0, 5) // just show top 5 missing from our list
    });
    
    setAnalyzed(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold">Resume Readiness Analyzer</h1>
        <p className="text-muted-foreground">Paste your resume text to instantly evaluate completeness.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Card */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Input Resume
            </CardTitle>
            <CardDescription>
              For privacy, analysis happens entirely in your browser. No data is uploaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <Label>Paste Resume Text</Label>
              <textarea 
                className="w-full min-h-[300px] p-3 rounded-md bg-background border border-border focus:ring-1 focus:ring-primary outline-none resize-none text-sm"
                placeholder="Copy and paste the plain text from your PDF or Word resume here..."
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
              />
            </div>
            <Button onClick={analyzeResume} className="w-full bg-primary hover:bg-primary/90" disabled={!resumeText.trim()}>
              <Search className="mr-2 h-4 w-4" /> Analyze Resume
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground w-full text-center">
              * This is a basic keyword evaluation and is not officially ATS-compatible.
            </p>
          </CardFooter>
        </Card>

        {/* Results Card */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>Structural completeness and keyword checks</CardDescription>
          </CardHeader>
          <CardContent>
            {!analyzed || !results ? (
              <div className="h-full min-h-[300px] flex items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-lg">
                Run analysis to see results
              </div>
            ) : (
              <div className="space-y-6">
                
                <div className="flex flex-col items-center justify-center p-4 bg-card/50 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground mb-1">Completeness Score</span>
                  <div className={`text-4xl font-bold ${results.score >= 80 ? 'text-success' : results.score >= 60 ? 'text-gold' : 'text-destructive'}`}>
                    {results.score}%
                  </div>
                  <Progress value={results.score} className="h-2 w-full mt-3 max-w-[200px]" />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">Section Detection</h4>
                  {results.sections.map(sec => (
                    <div key={sec.name} className="flex items-center justify-between">
                      <span className="text-sm">{sec.name}</span>
                      {sec.found ? <CheckCircle2 className="text-success h-5 w-5" /> : <XCircle className="text-destructive h-5 w-5" />}
                    </div>
                  ))}
                </div>

                {results.missingKeywords.length > 0 && (
                  <div className="pt-4 border-t border-border/50">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-gold" /> Potential Missing Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {results.missingKeywords.map(kw => (
                        <span key={kw} className="px-2 py-1 bg-muted rounded-md text-xs border border-border">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Ensure your resume includes relevant technical terms if applicable to your target role.
                    </p>
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
