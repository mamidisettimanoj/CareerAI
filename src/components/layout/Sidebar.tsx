"use client";

import { useState, useEffect, useCallback } from 'react';
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
  Info,
  FolderOpen,
  Bell,
  Search,
  Trophy,
  Target,
  X,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavSection {
  label: string;
  items: { name: string; path: string; icon: React.ElementType }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Core',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Today', path: '/today', icon: CheckCircle },
      { name: 'Profile', path: '/profile', icon: FileText },
      { name: 'Goals', path: '/goals', icon: Target },
    ],
  },
  {
    label: 'Academic',
    items: [
      { name: 'Academic', path: '/academic', icon: GraduationCap },
      { name: 'Calculators', path: '/calculators', icon: Calculator },
      { name: 'Predict', path: '/predict', icon: LineChart },
    ],
  },
  {
    label: 'Career',
    items: [
      { name: 'Career Center', path: '/career', icon: Briefcase },
      { name: 'Skills', path: '/skills', icon: CheckCircle },
      { name: 'Preparation', path: '/preparation', icon: ListTodo },
      { name: 'Placement', path: '/placement', icon: Bookmark },
      { name: 'Eligibility', path: '/eligibility', icon: Target },
    ],
  },
  {
    label: 'Portfolio',
    items: [
      { name: 'Portfolio', path: '/portfolio', icon: FolderOpen },
      { name: 'Projects', path: '/projects', icon: FileCheck },
      { name: 'Resume', path: '/resume', icon: FileText },
      { name: 'Achievements', path: '/achievements', icon: Trophy },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Analytics', path: '/analytics', icon: LineChart },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Search', path: '/search', icon: Search },
      { name: 'Settings', path: '/settings', icon: Settings },
      { name: 'About', path: '/about', icon: Info },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(path);
  };

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border/60">
        <GraduationCap className="h-6 w-6 text-primary shrink-0" />
        <h2 className="text-lg font-heading font-bold tracking-tight text-foreground truncate">
          CareerAI
        </h2>
        {/* Close button visible only on mobile/tablet overlay */}
        <button
          onClick={onClose}
          className="ml-auto lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5" role="navigation" aria-label="Main Navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((route) => (
                <Link key={route.path} href={route.path}>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive(route.path)
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <route.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{route.name}</span>
                    {isActive(route.path) && (
                      <ChevronRight className="h-3 w-3 ml-auto shrink-0 text-primary/60" />
                    )}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border/60">
        <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/40 rounded-lg">
          <span className="text-foreground font-medium">Local-First</span>
          <br />
          <span className="text-[10px]">All data stored in your browser</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible ≥1024px */}
      <aside
        className="hidden lg:flex w-64 shrink-0 flex-col h-[100dvh] sticky top-0 border-r border-border/60 bg-card"
      >
        {navContent}
      </aside>

      {/* Mobile/Tablet overlay — visible when open <1024px */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile/Tablet drawer — slides from left */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[300px] bg-card border-r border-border/60 shadow-2xl flex flex-col lg:hidden",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {navContent}
      </aside>
    </>
  );
}
