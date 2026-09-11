"use client";

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateProfileCompleteness } from '@/domain/profile/ProfileCompletenessEngine';
import { profileService } from '@/services/ProfileService';
import { CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function ProfilePage() {
  const storedProfile = useLiveQuery(() => db.profile.get('me'));
  
  // Use local state to avoid jumping inputs, update on save
  const [profile, setProfile] = useState<any>(null);
  
  // Initialize state once when data loads
  if (storedProfile && !profile) {
    setProfile(storedProfile);
  } else if (storedProfile === undefined) {
    return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  }

  const handleSave = async () => {
    if (profile) {
      // Validate Email
      if (profile.personal?.email && !profile.personal.email.includes('@')) {
        alert("Please enter a valid email address containing '@'.");
        return;
      }
      // Validate Phone
      if (profile.personal?.phone && !/^\d{10}$/.test(profile.personal.phone)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
      }
      // Validate URLs
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      const validateUrl = (url: string | undefined, name: string) => {
        if (url && !urlRegex.test(url)) {
          alert(`Please enter a valid URL for ${name}.`);
          return false;
        }
        return true;
      };
      
      if (!validateUrl(profile.links?.linkedin, 'LinkedIn')) return;
      if (!validateUrl(profile.links?.github, 'GitHub')) return;
      if (!validateUrl(profile.links?.portfolio, 'Portfolio')) return;
      if (!validateUrl(profile.links?.codingProfile, 'Coding Profile')) return;

      await profileService.saveProfile(profile);
      alert("Profile updated successfully");
    }
  };

  const completeness = calculateProfileCompleteness(profile);

  if (!profile) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2>No Profile Found</h2>
        <Button onClick={() => setProfile({
          personal: { gender: '', sscBoard: '', sscPercentage: 0, academicYear: '' },
          hsc: { board: '', stream: '', percentage: 0 },
          degree: { type: '', branch: '', percentage: 0, cgpa: 0, workExperience: 0, internships: 0, backlogs: 0 },
          mba: { specialization: '', percentage: 0 },
          skills: { employabilityScore: 0, technicalScore: 0, communicationScore: 0, projectsCount: 0, certificationsCount: 0 },
          targetRole: '',
          careerPreferences: {},
          links: {}
        })}>Initialize Profile</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Student Profile</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your personal, academic, and career details.</p>
        </div>
        <Button onClick={handleSave} className="w-full md:w-auto"><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Completeness Widget */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={completeness.percentage === 100 ? 'border-success' : 'border-gold'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Profile Completeness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold">{completeness.percentage}%</span>
                {completeness.percentage === 100 ? (
                  <CheckCircle2 className="h-8 w-8 text-success" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-gold" />
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-4 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${completeness.percentage === 100 ? 'bg-success' : 'bg-gold'}`} 
                  style={{ width: `${completeness.percentage}%` }}
                ></div>
              </div>
              
              {completeness.missingFields.length > 0 && (
                <div className="text-sm">
                  <p className="font-semibold mb-2 text-muted-foreground">Missing Critical Fields:</p>
                  <ul className="space-y-1 text-xs text-destructive">
                    {completeness.missingFields.map((field, i) => (
                      <li key={i}>• {field}</li>
                    ))}
                  </ul>
                </div>
              )}
              {completeness.percentage === 100 && (
                <p className="text-sm text-success font-medium">Your profile is complete! You will receive highly accurate career predictions.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profile.personal.name || ''} onChange={e => setProfile({...profile, personal: {...profile.personal, name: e.target.value}})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={profile.personal.email || ''} onChange={e => setProfile({...profile, personal: {...profile.personal, email: e.target.value}})} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={profile.personal.phone || ''} onChange={e => setProfile({...profile, personal: {...profile.personal, phone: e.target.value}})} />
              </div>
              <div className="space-y-2">
                <Label>Location / City</Label>
                <Input value={profile.personal.location || ''} onChange={e => setProfile({...profile, personal: {...profile.personal, location: e.target.value}})} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education Details</CardTitle>
              <CardDescription>Academic scores should be updated via the Academic Center. Enter your institution details here.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>College / Institution</Label>
                <Input value={profile.degree.college || ''} onChange={e => setProfile({...profile, degree: {...profile.degree, college: e.target.value}})} />
              </div>
              <div className="space-y-2">
                <Label>Degree Type</Label>
                <Select value={profile.degree.type || ''} onValueChange={v => setProfile({...profile, degree: {...profile.degree, type: v}})}>
                  <SelectTrigger><SelectValue placeholder="e.g. B.Tech" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B.Tech">B.Tech</SelectItem>
                    <SelectItem value="M.Tech">M.Tech</SelectItem>
                    <SelectItem value="BCA">BCA</SelectItem>
                    <SelectItem value="MCA">MCA</SelectItem>
                    <SelectItem value="B.Sc">B.Sc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch / Major</Label>
                <Input value={profile.degree.branch || ''} onChange={e => setProfile({...profile, degree: {...profile.degree, branch: e.target.value}})} placeholder="e.g. Computer Science" />
              </div>
              <div className="space-y-2">
                <Label>Graduation Year</Label>
                <Input type="number" value={profile.degree.graduationYear || ''} onChange={e => setProfile({...profile, degree: {...profile.degree, graduationYear: parseInt(e.target.value)}})} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Career Preferences</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Target Role</Label>
                <Input value={profile.targetRole || ''} onChange={e => setProfile({...profile, targetRole: e.target.value})} placeholder="e.g. Full Stack Developer" />
              </div>
              <div className="space-y-2">
                <Label>Target Industry</Label>
                <Input value={profile.careerPreferences?.targetIndustry || ''} onChange={e => setProfile({...profile, careerPreferences: {...profile.careerPreferences, targetIndustry: e.target.value}})} placeholder="e.g. FinTech, E-Commerce" />
              </div>
              <div className="space-y-2">
                <Label>Expected Package (LPA)</Label>
                <Input value={profile.careerPreferences?.expectedPackage || ''} onChange={e => setProfile({...profile, careerPreferences: {...profile.careerPreferences, expectedPackage: e.target.value}})} placeholder="e.g. 10 LPA" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input value={profile.links?.linkedin || ''} onChange={e => setProfile({...profile, links: {...profile.links, linkedin: e.target.value}})} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input value={profile.links?.github || ''} onChange={e => setProfile({...profile, links: {...profile.links, github: e.target.value}})} placeholder="https://github.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Portfolio URL</Label>
                <Input value={profile.links?.portfolio || ''} onChange={e => setProfile({...profile, links: {...profile.links, portfolio: e.target.value}})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Coding Profile (LeetCode/Hackerrank)</Label>
                <Input value={profile.links?.codingProfile || ''} onChange={e => setProfile({...profile, links: {...profile.links, codingProfile: e.target.value}})} placeholder="https://leetcode.com/..." />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
