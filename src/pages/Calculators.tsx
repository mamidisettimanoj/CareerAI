import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';

export function Calculators() {
  const [cgpa, setCgpa] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');
  const [formula, setFormula] = useState<string>('multiply95'); // default: cgpa * 9.5
  const [customFactor, setCustomFactor] = useState<string>('9.5');

  const handleConvert = () => {
    const cgpaVal = parseFloat(cgpa);
    if (isNaN(cgpaVal)) return;

    let result = 0;
    if (formula === 'multiply95') {
      result = cgpaVal * 9.5;
    } else if (formula === 'multiply10') {
      result = cgpaVal * 10;
    } else if (formula === 'minus075') {
      result = (cgpaVal - 0.75) * 10;
    } else if (formula === 'custom') {
      const factor = parseFloat(customFactor);
      if (!isNaN(factor)) {
        result = cgpaVal * factor;
      }
    }
    
    setPercentage(Math.min(100, Math.max(0, result)).toFixed(2));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold">Academic Calculators</h1>
        <p className="text-muted-foreground">Tools to help you convert grades and calculate averages.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CGPA to Percentage Converter */}
        <Card className="glass-panel col-span-1">
          <CardHeader>
            <CardTitle>CGPA ↔ Percentage</CardTitle>
            <CardDescription>Convert your CGPA to equivalent percentage based on university rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label>University Formula</Label>
              <Select value={formula} onValueChange={setFormula}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conversion rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiply95">Standard CBSE / AICTE (CGPA × 9.5)</SelectItem>
                  <SelectItem value="multiply10">10 Point Absolute (CGPA × 10)</SelectItem>
                  <SelectItem value="minus075">Mumbai University ((CGPA - 0.75) × 10)</SelectItem>
                  <SelectItem value="custom">Custom Multiplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formula === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Multiplier Factor</Label>
                <Input 
                  type="number" 
                  value={customFactor} 
                  onChange={(e) => setCustomFactor(e.target.value)} 
                  placeholder="E.g. 9.5" 
                />
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <div className="space-y-2 flex-1">
                <Label>CGPA (out of 10)</Label>
                <Input 
                  type="number" 
                  value={cgpa} 
                  onChange={(e) => setCgpa(e.target.value)} 
                  placeholder="E.g. 8.5" 
                  step="0.01"
                />
              </div>
              <div className="pt-6 text-muted-foreground flex-shrink-0">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Percentage (%)</Label>
                <Input 
                  type="text" 
                  value={percentage} 
                  readOnly 
                  className="bg-accent/10 border-accent/20 font-bold text-accent"
                />
              </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button onClick={handleConvert} className="w-full bg-primary hover:bg-primary/90">
              Calculate Percentage
            </Button>
          </CardFooter>
          <div className="px-6 pb-4 text-xs text-muted-foreground/70">
            * Conversion rules vary heavily by university. Verify the official conversion formula before using this for official job applications.
          </div>
        </Card>

        {/* SGPA Calculator Placeholder */}
        <Card className="glass-panel col-span-1 opacity-70">
          <CardHeader>
            <CardTitle>SGPA Calculator</CardTitle>
            <CardDescription>Calculate SGPA from subject credits and grades.</CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center border-t border-border mt-2">
            <p className="text-sm text-muted-foreground">Available in Academic Tracker module.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
