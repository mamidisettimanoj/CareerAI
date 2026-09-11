"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Library, FileSpreadsheet, ClipboardCheck, AlertTriangle, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/academic', label: 'Overview', icon: LayoutDashboard },
  { href: '/academic/semesters', label: 'Semesters', icon: Library },
  { href: '/academic/subjects', label: 'Subjects', icon: FileSpreadsheet },
  { href: '/academic/attendance', label: 'Attendance', icon: ClipboardCheck },
  { href: '/academic/backlogs', label: 'Backlogs', icon: AlertTriangle },
  { href: '/academic/analytics', label: 'Analytics', icon: LineChart },
];

export function AcademicNav() {
  const pathname = usePathname();

  return (
    <div className="flex overflow-x-auto pb-2 -mb-2 border-b border-border/50 no-scrollbar gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap",
              isActive 
                ? "bg-academic/10 text-academic border-b-2 border-academic" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-b-2 border-transparent"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
