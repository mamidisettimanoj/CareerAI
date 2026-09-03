"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Calculator, CheckCircle, Briefcase, FileText, ListTodo, LayoutDashboard, LineChart } from 'lucide-react';

const TOOLS = [
  {
    title: 'Analyze My Profile',
    desc: 'Get an estimated probability of placement based on your complete profile.',
    icon: LineChart,
    href: '/predict',
    color: 'text-primary',
    bg: 'bg-primary/20',
  },
  {
    title: 'Academic Analytics',
    desc: 'Monitor your SGPA/CGPA trends and analyze your semester performances over time.',
    icon: BarChart3,
    href: '/academic',
    color: 'text-accent',
    bg: 'bg-accent/20',
  },
  {
    title: 'Calculators',
    desc: 'Easily calculate and convert your SGPA, CGPA, and Percentage.',
    icon: Calculator,
    href: '/calculators',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/20',
  },
  {
    title: 'Placement Eligibility',
    desc: 'Check if you meet the criteria for top companies based on your academic record.',
    icon: CheckCircle,
    href: '/eligibility',
    color: 'text-success',
    bg: 'bg-success/20',
  },
  {
    title: 'Skill Gap Analyzer',
    desc: 'Compare your skills against industry standards for specific roles to identify weak areas.',
    icon: Briefcase,
    href: '/skills',
    color: 'text-gold',
    bg: 'bg-gold/20',
  },
  {
    title: 'Resume Readiness',
    desc: 'Get automated feedback on your resume format, keywords, and sections.',
    icon: FileText,
    href: '/resume',
    color: 'text-primary',
    bg: 'bg-primary/20',
  },
  {
    title: 'Career Preparation',
    desc: 'Track your preparation progress across aptitude, coding, and interview prep.',
    icon: ListTodo,
    href: '/preparation',
    color: 'text-accent',
    bg: 'bg-accent/20',
  },
  {
    title: 'Student Dashboard',
    desc: 'View your holistic career and academic progress all in one place.',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/20',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background relative overflow-hidden py-12">
      
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
        <div className="inline-block px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
          STUDENT CAREER & PLACEMENT ANALYZER
        </div>
        
        <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Build a stronger academic profile.<br className="hidden md:block" />
          Build stronger technical skills.<br className="hidden md:block" />
          Become <span >placement ready</span>.
        </h1>
        
        <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl mb-8">
          A complete digital career-readiness platform for B.Tech students. Track, analyze, and improve your entire profile.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto px-4">
          <Link href="/predict" className="w-full sm:w-auto">
            <Button size="lg" className="w-full font-semibold bg-primary hover:bg-primary/90 h-14 sm:h-12 px-8">
              Analyze My Profile
              <ArrowRight className="ml-2 h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </Link>
          <a href="#explore-tools" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full font-semibold h-14 sm:h-12 px-8 ">
              Explore Career Tools
            </Button>
          </a>
        </div>
        
        <div id="explore-tools" className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-8">
          {TOOLS.map((tool, idx) => (
            <Link key={idx} href={tool.href} className="block group">
              <div className="p-6 flex flex-col items-center text-center h-full transition-all duration-300">
                <div className={`h-14 w-14 rounded-full ${tool.bg} flex items-center justify-center mb-4 ${tool.color} group-hover:scale-110 transition-transform`}>
                  <tool.icon className="h-7 w-7" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">{tool.title}</h3>
                <p className="text-muted-foreground text-sm">{tool.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-xs text-muted-foreground/60 max-w-2xl px-4">
          * This estimate is an educational analytics tool and does not guarantee employment or placement outcomes. 
          The data used in demo mode is fictional and meant for demonstration purposes only.
        </div>
      </div>
    </div>
  );
}


