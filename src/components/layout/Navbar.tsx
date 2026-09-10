"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Menu, X, LayoutDashboard, LineChart, Calculator, CheckCircle, Briefcase, FileText, ListTodo, Settings, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { notificationEngine } from '@/domain/notifications/engine/LocalNotificationEngine';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notifications
  const unreadCount = useLiveQuery(() => 
    db.notifications.filter(n => !n.isRead).count()
  ) || 0;

  useEffect(() => {
    // Generate deterministic notifications on load
    notificationEngine.generateNotifications().catch(console.error);
    // Cleanup old notifications
    import('@/repositories/local/LocalNotificationRepository').then(({ LocalNotificationRepository }) => {
      new LocalNotificationRepository().deleteOldNotifications();
    });
  }, []);

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
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Today', path: '/today', icon: CheckCircle },
    { name: 'Academic', path: '/academic', icon: LineChart },
    { name: 'Preparation', path: '/preparation', icon: ListTodo },
    { name: 'Portfolio', path: '/portfolio', icon: FileText },
    { name: 'Career', path: '/career', icon: Briefcase },
    { name: 'Placement', path: '/placement', icon: GraduationCap },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold sm:inline-block">
                CareerAI
              </span>
            </Link>
            <nav className="hidden xl:flex items-center space-x-6 text-sm font-medium">
              {routes.slice(0, 5).map(r => (
                <Link key={r.path} href={r.path} className={cn("transition-colors hover:text-foreground/80 flex items-center gap-1", pathname?.startsWith(r.path) ? 'text-foreground font-bold' : 'text-foreground/60')}>
                  {r.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              
              <Link href="/search">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Search">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>

              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </Button>
              </Link>
              
              <Button variant="ghost" size="icon" className="xl:hidden text-foreground" onClick={toggleMenu} aria-label="Toggle Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </nav>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[280px] sm:w-[350px] bg-card border-l border-border/40 shadow-2xl transform transition-transform duration-300 ease-in-out xl:hidden flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
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
                    "w-full flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors mb-1",
                    pathname?.startsWith(route.path)
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
      </div>
    </>
  );
}
