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
  Users,
  Building,
  GraduationCap,
  Bell,
  Search,
  Activity,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signout } from '@/actions/auth';
import { Role } from '@prisma/client';

type SidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  userEmail?: string;
  userRole?: Role;
};

export function Sidebar({ className, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();

  const studentRoutes = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Predict', path: '/predict', icon: LineChart },
    { name: 'Academic', path: '/academic', icon: GraduationCap },
    { name: 'Skills', path: '/skills', icon: Briefcase },
    { name: 'Projects', path: '/projects', icon: FileCheck },
    { name: 'Resume', path: '/resume', icon: FileText },
    { name: 'Preparation', path: '/preparation', icon: ListTodo },
    { name: 'Jobs', path: '/jobs', icon: Search },
    { name: 'Applications', path: '/applications', icon: FileCheck },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const recruiterRoutes = [
    { name: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', path: '/recruiter/jobs', icon: Search },
    { name: 'Candidates', path: '/recruiter/candidates', icon: Users },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const placementRoutes = [
    { name: 'Dashboard', path: '/placement/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/placement/students', icon: Users },
    { name: 'Drives', path: '/placement/drives', icon: Briefcase },
    { name: 'Eligibility', path: '/placement/eligibility', icon: CheckCircle },
    { name: 'Reports', path: '/placement/reports', icon: LineChart },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const adminRoutes = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Companies', path: '/admin/companies', icon: Building },
    { name: 'Institutions', path: '/admin/institutions', icon: GraduationCap },
    { name: 'Memberships', path: '/admin/memberships', icon: FileCheck },
    { name: 'Audit', path: '/admin/audit', icon: Activity },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  let routes = studentRoutes;
  if (userRole === 'RECRUITER') routes = recruiterRoutes;
  if (userRole === 'PLACEMENT_ADMIN') routes = placementRoutes;
  if (userRole === 'SUPER_ADMIN') routes = adminRoutes;

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
        {userEmail && (
          <div className="px-4 py-2 text-xs text-muted-foreground break-words bg-muted/30 rounded-lg">
            Signed in as<br/>
            <span className="text-foreground font-medium">{userEmail}</span>
            <br />
            <span className="text-[10px] uppercase font-bold text-primary mt-1 inline-block">{userRole || 'STUDENT'}</span>
          </div>
        )}
        <form action={signout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors border border-destructive/20"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
