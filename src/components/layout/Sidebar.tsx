"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  LineChart, 
  Calculator, 
  Briefcase, 
  CheckCircle,
  FileText,
  ListTodo,
  Settings,
  GraduationCap,
  FileCheck,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const routes = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Today', path: '/today', icon: CheckCircle },
    { name: 'Profile', path: '/profile', icon: FileText },
    { name: 'Goals', path: '/goals', icon: ListTodo },
    { name: 'Academic', path: '/academic', icon: GraduationCap },
    { name: 'Career Center', path: '/career', icon: Briefcase },
    { name: 'Career Paths', path: '/career/paths', icon: Briefcase },
    { name: 'Skills', path: '/skills', icon: CheckCircle },
    { name: 'Calculators', path: '/calculators', icon: Calculator },
    { name: 'Predict', path: '/predict', icon: LineChart },
    { name: 'Projects', path: '/projects', icon: FileCheck },
    { name: 'Resume', path: '/resume', icon: FileText },
    { name: 'Preparation', path: '/preparation', icon: ListTodo },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About', path: '/about', icon: Info },
  ];

  return (
    <div className={cn("pb-12 w-64 hidden md:flex flex-col border-r border-border/40 bg-white dark:bg-black", className)}>
      <div className="space-y-4 py-4 flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <div className="mb-6 px-4 flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-heading font-bold tracking-tight text-foreground">
              CareerAI
            </h2>
          </div>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link key={route.path} href={route.path}>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors mb-1",
                    pathname?.startsWith(route.path) 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.name}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto p-4 space-y-4 border-t border-border/40">
        <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 rounded-lg">
          <span className="text-foreground font-medium">Local-First</span>
          <br />
          <span className="text-[10px]">All data stored in your browser</span>
        </div>
      </div>
    </div>
  );
}
