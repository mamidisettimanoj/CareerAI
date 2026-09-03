"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Menu, X, LayoutDashboard, LineChart, Calculator, CheckCircle, Briefcase, FileText, ListTodo, Settings } from 'lucide-react';
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
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const routes = [
    { name: 'Home', path: '/', icon: GraduationCap },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Predict', path: '/predict', icon: LineChart },
    { name: 'Academic Tracker', path: '/academic', icon: LineChart },
    { name: 'Calculators', path: '/calculators', icon: Calculator },
    { name: 'Eligibility', path: '/eligibility', icon: CheckCircle },
    { name: 'Skills Gap', path: '/skills', icon: Briefcase },
    { name: 'Resume', path: '/resume', icon: FileText },
    { name: 'Preparation', path: '/preparation', icon: ListTodo },
    { name: 'About', path: '/about', icon: Settings },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold sm:inline-block">
                CareerAI
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="/dashboard" className={cn("transition-colors hover:text-foreground/80", pathname === '/dashboard' ? 'text-foreground' : 'text-foreground/60')}>
                Dashboard
              </Link>
              <Link href="/predict" className={cn("transition-colors hover:text-foreground/80", pathname === '/predict' ? 'text-foreground' : 'text-foreground/60')}>
                Predict
              </Link>
              <Link href="/calculators" className={cn("transition-colors hover:text-foreground/80", pathname?.includes('/calculators') ? 'text-foreground' : 'text-foreground/60')}>
                Calculators
              </Link>
              <Link href="/skills" className={cn("transition-colors hover:text-foreground/80", pathname?.includes('/skills') ? 'text-foreground' : 'text-foreground/60')}>
                Skills
              </Link>
              <Link href="/about" className={cn("transition-colors hover:text-foreground/80", pathname === '/about' ? 'text-foreground' : 'text-foreground/60')}>
                About
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Link href="/predict">
                <Button size="sm" className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  Analyze My Profile
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground" onClick={toggleMenu} aria-label="Toggle Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </nav>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[280px] sm:w-[350px] bg-card border-l border-border/40 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <span className="font-heading font-bold text-lg">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-1">
            {routes.map((route) => (
              <Link key={route.path} href={route.path}>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors mb-1",
                    pathname === route.path 
                      ? "bg-primary/20 text-primary border border-primary/20" 
                      : "text-foreground/70 hover:bg-accent/10 hover:text-accent"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  {route.name}
                </button>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-border/40">
          <Link href="/predict">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Analyze My Profile
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
