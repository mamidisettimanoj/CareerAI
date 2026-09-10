"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CandidateSkill, SkillCategory } from '@/domain/skills/types/skill.types';
import { normalizeSkillName } from '@/domain/skills/engine/SkillNormalizer';
import { skillService } from '@/services/SkillService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus, Edit2, Trash2, Award, BrainCircuit, Activity } from 'lucide-react';

const CATEGORIES: SkillCategory[] = [
  'Programming Languages', 'Frameworks', 'Databases', 'Cloud', 
  'DevOps', 'Tools', 'Data/ML', 'Web', 'Mobile', 'Soft Skills', 'Other'
];

export default function SkillsPage() {
  const skills = useLiveQuery(() => db.skills.toArray()) || [];
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<CandidateSkill>>({ proficiencyScore: 50 });

  const handleAdd = () => {
    setFormData({
      name: '',
      category: 'Programming Languages',
      proficiencyScore: 50
    });
    setIsAdding(true);
  };

  const handleEdit = (skill: CandidateSkill) => {
    setFormData(skill);
    setIsAdding(true);
  };

  const handleDelete = async (name: string) => {
    if (confirm("Delete this skill?")) {
      await skillService.deleteSkill(name);
    }
  };

  const handleSave = async () => {
    if (formData.name && formData.category && formData.proficiencyScore !== undefined) {
      const normalized = normalizeSkillName(formData.name);
      const skillToSave: CandidateSkill = {
        name: formData.name,
        normalizedName: normalized,
        category: formData.category as SkillCategory,
        proficiencyScore: formData.proficiencyScore,
        proficiencyLevel: 'BEGINNER', // will be overwritten in repository logic
        evidence: formData.evidence || [{ source: 'SELF_REPORTED', strength: 'MEDIUM' }]
      };
      
      await skillService.saveSkill(skillToSave);
      setIsAdding(false);
    }
  };

  const getLevelLabel = (score: number) => {
    if (score >= 80) return 'Expert';
    if (score >= 60) return 'Advanced';
    if (score >= 40) return 'Intermediate';
    return 'Beginner';
  };

  const getLevelColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10 border-success/20';
    if (score >= 60) return 'text-primary bg-primary/10 border-primary/20';
    if (score >= 40) return 'text-gold bg-gold/10 border-gold/20';
    return 'text-muted-foreground bg-muted border-border';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Skills Center</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your technical and soft skills to unlock career matching.</p>
        </div>
        <Button onClick={handleAdd} disabled={isAdding}><Plus className="h-4 w-4 mr-2" /> Add Skill</Button>
      </div>

      {isAdding && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader><CardTitle>{formData.normalizedName ? 'Edit Skill' : 'New Skill'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Skill Name *</Label>
                <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. JavaScript" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v: any) => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-4 col-span-1 md:col-span-2">
                <Label className="flex justify-between">
                  <span>Proficiency</span>
                  <span className="font-bold text-primary">{getLevelLabel(formData.proficiencyScore || 0)} ({formData.proficiencyScore} / 100)</span>
                </Label>
                <Slider 
                  value={[formData.proficiencyScore || 0]} 
                  onValueChange={v => setFormData({...formData, proficiencyScore: v[0]})} 
                  max={100} step={5} 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formData.name}>Save Skill</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="md:col-span-1 bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> Skill Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Skills</span>
              <span className="font-bold text-lg">{skills.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expert / Advanced</span>
              <span className="font-bold text-success text-lg">{skills.filter(s => s.proficiencyScore >= 60).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Top Category</span>
              <span className="font-semibold text-right">
                {skills.length > 0 
                  ? Object.entries(skills.reduce((acc, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {} as Record<string,number>))
                      .sort((a,b) => b[1] - a[1])[0][0]
                  : 'N/A'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Award className="h-5 w-5" /> Your Skill Matrix
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skills.length === 0 && !isAdding && (
              <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                No skills added yet. Add your skills to match with target roles.
              </div>
            )}
            {skills.sort((a, b) => b.proficiencyScore - a.proficiencyScore).map(skill => (
              <div key={skill.name} className="group relative flex flex-col justify-between p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold">{skill.name}</h4>
                    <p className="text-xs text-muted-foreground">{skill.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getLevelColor(skill.proficiencyScore)}`}>
                    {getLevelLabel(skill.proficiencyScore)}
                  </span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${skill.proficiencyScore}%` }}></div>
                </div>

                {/* Actions */}
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm rounded-lg p-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit(skill)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(skill.name)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
