"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CareerIntelligenceInput, EligibilityResult } from '@/domain/career-intelligence/types/intelligence.types';
import { calculateEligibility, EligibilityCriteria } from '@/domain/career-intelligence/engine/EligibilityEngine';
import { CheckCircle2, XCircle, AlertCircle, Building2 } from 'lucide-react';

interface CompanyCriteria {
  minCgpa: number;
  minSsc: number;
  minHsc: number;
  maxBacklogs: number;
  requireExperience: boolean;
}

interface EligibilityClientProps {
  input: CareerIntelligenceInput;
}

export function EligibilityClient({ input }: EligibilityClientProps) {
  const [criteria, setCriteria] = useState<CompanyCriteria>({
    minCgpa: 7.0,
    minSsc: 60.0,
    minHsc: 60.0,
    maxBacklogs: 0,
    requireExperience: false
  });

  const [result, setResult] = useState<EligibilityResult | null>(null);

  const handleCheck = () => {
    const customPreset: EligibilityCriteria = {
      presetName: "Custom",
      minCgpa: criteria.minCgpa,
      minSsc: criteria.minSsc,
      minHsc: criteria.minHsc,
      maxBacklogs: criteria.maxBacklogs,
      minInternships: criteria.requireExperience ? 1 : 0
    };
    
    const [eligibility] = calculateEligibility(input, [customPreset]);
    setResult(eligibility);
  };

  const loadPreset = (preset: 'MAANG' | 'TCS' | 'STARTUP') => {
    if (preset === 'MAANG') setCriteria({ minCgpa: 8.0, minSsc: 70, minHsc: 70, maxBacklogs: 0, requireExperience: true });
    if (preset === 'TCS') setCriteria({ minCgpa: 6.0, minSsc: 60, minHsc: 60, maxBacklogs: 1, requireExperience: false });
    if (preset === 'STARTUP') setCriteria({ minCgpa: 6.5, minSsc: 50, minHsc: 50, maxBacklogs: 2, requireExperience: true });
    setResult(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold">Placement Eligibility Checker</h1>
        <p className="text-muted-foreground">Check if your profile meets specific company requirements.</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Button variant="outline" size="sm" onClick={() => loadPreset('MAANG')} className="border-accent/30 hover:bg-accent/10">Top Tech (MAANG) Preset</Button>
        <Button variant="outline" size="sm" onClick={() => loadPreset('TCS')} className="border-primary/30 hover:bg-primary/10">Service Based Preset</Button>
        <Button variant="outline" size="sm" onClick={() => loadPreset('STARTUP')} className="border-success/30 hover:bg-success/10">Startup Preset</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Form */}
        <Card >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Company Requirements
            </CardTitle>
            <CardDescription>Define the minimum criteria for the role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Minimum CGPA</Label>
              <Input type="number" step="0.1" value={criteria.minCgpa} onChange={e => setCriteria({...criteria, minCgpa: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum SSC %</Label>
                <Input type="number" value={criteria.minSsc} onChange={e => setCriteria({...criteria, minSsc: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label>Minimum HSC %</Label>
                <Input type="number" value={criteria.minHsc} onChange={e => setCriteria({...criteria, minHsc: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Maximum Allowed Backlogs</Label>
              <Input type="number" value={criteria.maxBacklogs} onChange={e => setCriteria({...criteria, maxBacklogs: parseInt(e.target.value) || 0})} />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input type="checkbox" id="req-exp" className="w-4 h-4 rounded border-border bg-background" checked={criteria.requireExperience} onChange={e => setCriteria({...criteria, requireExperience: e.target.checked})} />
              <Label htmlFor="req-exp">Requires past internships/experience</Label>
            </div>
            
            <Button onClick={handleCheck} className="w-full mt-4 bg-primary hover:bg-primary/90">Check Eligibility</Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card >
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-lg">
                Run check to see results
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-4 rounded-lg flex items-center justify-center border ${result.status === 'ELIGIBLE' ? 'bg-success/10 border-success/30 text-success' : result.status === 'INSUFFICIENT_DATA' ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
                  <span className="text-2xl font-bold tracking-widest">{result.status.replace('_', ' ')}</span>
                </div>
                
                {result.status !== 'INSUFFICIENT_DATA' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">Criteria Breakdown</h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CGPA (≥ {criteria.minCgpa})</span>
                      {result.checks.cgpa ? <CheckCircle2 className="text-success h-5 w-5" /> : <XCircle className="text-destructive h-5 w-5" />}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SSC % (≥ {criteria.minSsc}%)</span>
                      {result.checks.ssc ? <CheckCircle2 className="text-success h-5 w-5" /> : <XCircle className="text-destructive h-5 w-5" />}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">HSC % (≥ {criteria.minHsc}%)</span>
                      {result.checks.hsc ? <CheckCircle2 className="text-success h-5 w-5" /> : <XCircle className="text-destructive h-5 w-5" />}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Backlogs (≤ {criteria.maxBacklogs})</span>
                      {result.checks.backlogs ? <CheckCircle2 className="text-success h-5 w-5" /> : <XCircle className="text-destructive h-5 w-5" />}
                    </div>
                    
                    {criteria.requireExperience && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Experience / Internships</span>
                        {result.checks.experience ? <CheckCircle2 className="text-success h-5 w-5" /> : <XCircle className="text-destructive h-5 w-5" />}
                      </div>
                    )}
                  </div>
                )}
                
                {result.status === 'NOT_ELIGIBLE' && (
                  <div className="p-3 bg-muted/50 rounded flex gap-2 items-start mt-4">
                    <AlertCircle className="h-5 w-5 text-gold shrink-0" />
                    <p className="text-xs text-muted-foreground">You do not meet one or more criteria. Focus on clearing backlogs and maintaining a strong CGPA to increase your eligible opportunities.</p>
                  </div>
                )}
                {result.status === 'INSUFFICIENT_DATA' && (
                  <div className="p-3 bg-muted/50 rounded flex gap-2 items-start mt-4">
                    <AlertCircle className="h-5 w-5 text-gold shrink-0" />
                    <p className="text-xs text-muted-foreground">Please complete your profile to check eligibility.</p>
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
