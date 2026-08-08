import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { calculatePlacementScore } from '@/lib/prediction';
import { loadData, saveData } from '@/lib/storage';
import { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  personal: z.object({
    gender: z.string().min(1, 'Required'),
    sscBoard: z.string().min(1, 'Required'),
    sscPercentage: z.number().min(0).max(100),
    academicYear: z.string().min(4, 'Required'),
  }),
  hsc: z.object({
    board: z.string().min(1, 'Required'),
    stream: z.string().min(1, 'Required'),
    percentage: z.number().min(0).max(100),
  }),
  degree: z.object({
    type: z.string().min(1, 'Required'),
    branch: z.string().min(1, 'Required'),
    percentage: z.number().min(0).max(100),
    cgpa: z.number().min(0).max(10),
    workExperience: z.number().min(0),
    internships: z.number().min(0),
    backlogs: z.number().min(0),
  }),
  mba: z.object({
    specialization: z.string(),
    percentage: z.number().min(0).max(100),
  }),
  skills: z.object({
    employabilityScore: z.number().min(0).max(100),
    technicalScore: z.number().min(0).max(100),
    communicationScore: z.number().min(0).max(100),
    projectsCount: z.number().min(0),
    certificationsCount: z.number().min(0),
  }),
  targetRole: z.string().min(1, 'Required'),
});

export function Predict() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      personal: { gender: '', sscBoard: '', sscPercentage: 0, academicYear: new Date().getFullYear().toString() },
      hsc: { board: '', stream: '', percentage: 0 },
      degree: { type: '', branch: '', percentage: 0, cgpa: 0, workExperience: 0, internships: 0, backlogs: 0 },
      mba: { specialization: 'None', percentage: 0 },
      skills: { employabilityScore: 50, technicalScore: 50, communicationScore: 50, projectsCount: 0, certificationsCount: 0 },
      targetRole: '',
    }
  });

  useEffect(() => {
    const data = loadData();
    if (data.profile) {
      form.reset(data.profile);
    }
  }, [form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    const profile = values as UserProfile;
    const { score } = calculatePlacementScore(profile);
    
    const newPrediction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      readinessScore: score,
      cgpa: profile.degree.cgpa,
      aptitude: profile.skills.employabilityScore,
      placementEstimate: score,
      targetRole: profile.targetRole
    };

    const currentData = loadData();
    saveData({
      profile,
      predictions: [newPrediction, ...currentData.predictions]
    });

    toast({
      title: "Analysis Complete",
      description: "Your profile has been successfully evaluated.",
    });

    navigate('/result');
  };

  const nextStep = () => {
    // Validate current step before proceeding (simplified)
    setStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const progress = (step / 4) * 100;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Placement Prediction Engine</h1>
        <p className="text-muted-foreground">Complete your profile to get a comprehensive career readiness estimate.</p>
      </div>

      <Progress value={progress} className="h-2 mb-8" />

      <Card className="glass-panel">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Step {step} of 4: {
              step === 1 ? 'Personal & SSC Details' :
              step === 2 ? 'HSC Details' :
              step === 3 ? 'Degree & Experience' :
              'Skills & Target Role'
            }</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Input {...form.register('personal.gender')} placeholder="E.g. Male, Female" />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input {...form.register('personal.academicYear')} type="number" placeholder="E.g. 2025" />
                </div>
                <div className="space-y-2">
                  <Label>SSC Board</Label>
                  <Input {...form.register('personal.sscBoard')} placeholder="E.g. CBSE, State Board" />
                </div>
                <div className="space-y-2">
                  <Label>SSC Percentage</Label>
                  <Input {...form.register('personal.sscPercentage', { valueAsNumber: true })} type="number" step="0.1" max="100" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>HSC Board</Label>
                  <Input {...form.register('hsc.board')} placeholder="E.g. CBSE, State Board" />
                </div>
                <div className="space-y-2">
                  <Label>Stream</Label>
                  <Input {...form.register('hsc.stream')} placeholder="E.g. Science (PCM)" />
                </div>
                <div className="space-y-2">
                  <Label>HSC Percentage</Label>
                  <Input {...form.register('hsc.percentage', { valueAsNumber: true })} type="number" step="0.1" max="100" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree Type</Label>
                  <Input {...form.register('degree.type')} placeholder="E.g. B.Tech, B.Sc" />
                </div>
                <div className="space-y-2">
                  <Label>Branch/Specialization</Label>
                  <Input {...form.register('degree.branch')} placeholder="E.g. Computer Science" />
                </div>
                <div className="space-y-2">
                  <Label>Degree CGPA (out of 10)</Label>
                  <Input {...form.register('degree.cgpa', { valueAsNumber: true })} type="number" step="0.1" max="10" />
                </div>
                <div className="space-y-2">
                  <Label>Degree Percentage (optional)</Label>
                  <Input {...form.register('degree.percentage', { valueAsNumber: true })} type="number" step="0.1" max="100" />
                </div>
                <div className="space-y-2">
                  <Label>Active Backlogs</Label>
                  <Input {...form.register('degree.backlogs', { valueAsNumber: true })} type="number" min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Work Experience (Months)</Label>
                  <Input {...form.register('degree.workExperience', { valueAsNumber: true })} type="number" min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Internships Count</Label>
                  <Input {...form.register('degree.internships', { valueAsNumber: true })} type="number" min="0" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Target Role</Label>
                  <Input {...form.register('targetRole')} placeholder="E.g. Software Developer, Data Analyst" />
                </div>
                
                <div className="space-y-4">
                  <Label className="text-base">Self-Assessment Scores (0-100)</Label>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs text-muted-foreground">Aptitude / Employability Test Score</Label>
                      <span className="text-xs">{form.watch('skills.employabilityScore')}</span>
                    </div>
                    <Slider 
                      min={0} max={100} step={1} 
                      value={[form.watch('skills.employabilityScore')]} 
                      onValueChange={(v) => form.setValue('skills.employabilityScore', v[0])} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs text-muted-foreground">Technical Skill Score</Label>
                      <span className="text-xs">{form.watch('skills.technicalScore')}</span>
                    </div>
                    <Slider 
                      min={0} max={100} step={1} 
                      value={[form.watch('skills.technicalScore')]} 
                      onValueChange={(v) => form.setValue('skills.technicalScore', v[0])} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs text-muted-foreground">Communication Score</Label>
                      <span className="text-xs">{form.watch('skills.communicationScore')}</span>
                    </div>
                    <Slider 
                      min={0} max={100} step={1} 
                      value={[form.watch('skills.communicationScore')]} 
                      onValueChange={(v) => form.setValue('skills.communicationScore', v[0])} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Projects Count</Label>
                    <Input {...form.register('skills.projectsCount', { valueAsNumber: true })} type="number" min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Certifications Count</Label>
                    <Input {...form.register('skills.certificationsCount', { valueAsNumber: true })} type="number" min="0" />
                  </div>
                </div>
              </div>
            )}
            
          </CardContent>
          <CardFooter className="flex justify-between">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
            ) : (
              <div></div>
            )}
            {step < 4 ? (
              <Button type="button" onClick={nextStep}>Next Step</Button>
            ) : (
              <Button type="submit" className="bg-primary hover:bg-primary/90">Analyze Profile</Button>
            )}
          </CardFooter>
        </form>
      </Card>
      
      <div className="text-xs text-center text-muted-foreground/60">
        All data is stored locally in your browser.
      </div>
    </div>
  );
}
