"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Menu, X, LayoutDashboard, Briefcase, FileText, ListTodo, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const routes = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Career', path: '/career', icon: Briefcase },
    { name: 'Portfolio', path: '/portfolio', icon: FileText },
    { name: 'Preparation', path: '/preparation', icon: ListTodo },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-14 sm:h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold sm:inline-block">
                CareerAI
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {routes.slice(0, 4).map(r => (
                <Link key={r.path} href={r.path} className={cn("transition-colors hover:text-foreground/80 flex items-center gap-1", pathname?.startsWith(r.path) ? 'text-foreground font-bold' : 'text-foreground/60')}>
                  {r.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Link href="/dashboard">
              <Button size="sm" className="hidden sm:inline-flex">Open App</Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu" aria-expanded={isMobileMenuOpen}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-[280px] bg-card border-l border-border/60 shadow-2xl transform transition-transform duration-200 ease-out md:hidden flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <span className="font-heading font-bold text-lg">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close Menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-1">
            {routes.map((route) => (
              <Link key={route.path} href={route.path}>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors mb-1",
                    pathname?.startsWith(route.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <route.icon className="h-5 w-5 shrink-0" />
                  {route.name}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
