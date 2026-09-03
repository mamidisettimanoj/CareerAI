"use client";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface DashboardChartsProps {
  sgpaData: any[];
  skillsData: any[];
}

export function DashboardCharts({ sgpaData, skillsData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* SGPA Trend */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>SGPA Trend</CardTitle>
          <CardDescription>Your academic performance across semesters</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {sgpaData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sgpaData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="sgpa" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground flex-col">
              <p>No semester data available.</p>
              <Link href="/academic" className="text-primary mt-2 hover:underline">Add Semesters</Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Radar */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Skill Profile Radar</CardTitle>
          <CardDescription>Visual breakdown of your readiness factors</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
              <PolarGrid className="stroke-border" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '8px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
