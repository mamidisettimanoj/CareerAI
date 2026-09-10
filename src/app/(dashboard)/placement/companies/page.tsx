"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { COMPANIES } from '@/data/placement/companies';
import { ELIGIBILITY_RULES } from '@/data/placement/eligibility-rules';
import { checkEligibility } from '@/domain/placement/engine/EligibilityEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, CheckCircle2, XCircle, AlertCircle, BookmarkPlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function CompaniesDirectory() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const savedApplications = useLiveQuery(() => db.applications.toArray()) || [];

  const handleSaveToPipeline = async (company: typeof COMPANIES[0], role: typeof COMPANIES[0]['roles'][0]) => {
    if (!db) return;
    const existing = savedApplications.find(a => a.companyId === company.id && a.roleId === role.id);
    if (existing) {
      alert('Already in pipeline!');
      return;
    }

    const appId = uuidv4();
    await db.applications.put({
      id: appId,
      companyId: company.id,
      companyName: company.name,
      roleId: role.id,
      roleTitle: role.title,
      appliedDate: new Date().toISOString(),
      status: 'SAVED',
      currentStage: 'Not Applied',
    });
    
    await db.applicationEvents.put({
      id: uuidv4(),
      applicationId: appId,
      date: new Date().toISOString(),
      type: 'STATE_CHANGE',
      newState: 'SAVED',
      description: 'Added to pipeline.'
    });

    alert(`${company.name} added to your pipeline!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" /> Companies Directory
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Discover top recruiters, check eligibility, and save to your pipeline.</p>
        </div>
      </div>

      <div className="space-y-6">
        {COMPANIES.map(company => {
          return (
            <Card key={company.id} className="overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 bg-muted/30 p-6 border-r flex flex-col justify-center items-center text-center space-y-4">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{company.name}</h2>
                    <p className="text-sm text-muted-foreground">{company.industry}</p>
                  </div>
                </div>
                
                <div className="md:w-2/3 p-6 space-y-6">
                  <p className="text-sm">{company.description}</p>
                  
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2">Available Roles & Eligibility</h3>
                    {company.roles.map(role => {
                      // Find eligibility rule (mapping role ID to rule ID in a real app, here we map by company roughly)
                      const rule = ELIGIBILITY_RULES.find(r => r.companyId === company.id && (r.id.includes(role.id.split('-')[1]) || true));
                      
                      let eligibility = null;
                      if (profile && rule) {
                        eligibility = checkEligibility(profile, rule);
                      }

                      const isInPipeline = savedApplications.some(a => a.companyId === company.id && a.roleId === role.id);

                      return (
                        <div key={role.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-lg bg-muted/5">
                          <div className="space-y-1">
                            <h4 className="font-semibold">{role.title}</h4>
                            <div className="flex gap-2 text-xs">
                              <Badge variant="outline">{role.packageRange.min} - {role.packageRange.max} LPA</Badge>
                              <Badge variant="secondary">{role.locations[0]}</Badge>
                            </div>
                            
                            {eligibility && (
                              <div className={`text-xs flex items-center gap-1 mt-2 ${
                                eligibility.status === 'ELIGIBLE' ? 'text-success' : 
                                eligibility.status === 'CONDITIONAL' ? 'text-gold' : 'text-destructive'
                              }`}>
                                {eligibility.status === 'ELIGIBLE' && <CheckCircle2 className="h-3 w-3" />}
                                {eligibility.status === 'CONDITIONAL' && <AlertCircle className="h-3 w-3" />}
                                {eligibility.status === 'NOT_ELIGIBLE' && <XCircle className="h-3 w-3" />}
                                {eligibility.status === 'ELIGIBLE' ? 'Eligible to apply' : eligibility.reasons[0]}
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            variant={isInPipeline ? "secondary" : "default"} 
                            size="sm"
                            disabled={isInPipeline}
                            onClick={() => handleSaveToPipeline(company, role)}
                          >
                            <BookmarkPlus className="h-4 w-4 mr-2" />
                            {isInPipeline ? 'Saved' : 'Save'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
