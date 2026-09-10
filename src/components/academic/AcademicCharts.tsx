"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SemesterData } from '@/types';

interface AcademicChartsProps {
  semesters: SemesterData[];
  hasSemesters: boolean;
  trend: string;
}

export function AcademicCharts({ semesters, hasSemesters, trend }: AcademicChartsProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> SGPA Trend Tracker
        </CardTitle>
        <CardDescription>Visualize your semester-over-semester performance.</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasSemesters ? (
          <div className="h-64 flex items-center justify-center border border-dashed border-border/50 rounded text-muted-foreground">
            No semester data added yet. Go to Dashboard to add.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={semesters} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="#888" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#141b2d', borderColor: '#1f2937', color: '#fff' }}
                  itemStyle={{ color: '#4361ee' }}
                />
                <Line type="monotone" dataKey="sgpa" stroke="#4361ee" strokeWidth={3} dot={{ r: 5, fill: '#4361ee' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {hasSemesters && (
          <div className="mt-6 p-4 bg-accent/5 rounded-lg border border-accent/20 flex items-start gap-3">
            {trend === 'Improving' ? <TrendingUp className="h-5 w-5 text-success shrink-0 mt-0.5" /> : 
             trend === 'Declining' ? <TrendingDown className="h-5 w-5 text-destructive shrink-0 mt-0.5" /> : 
             <Minus className="h-5 w-5 text-gold shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-sm">Trend: {trend}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {trend === 'Improving' ? 'Great job! Your SGPA has improved recently. Maintain this momentum.' : 
                 trend === 'Declining' ? 'Your SGPA has dipped recently. Identify weak subjects and allocate more study time.' :
                 'Your performance is stable. Try to push it slightly higher in the upcoming semester.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
