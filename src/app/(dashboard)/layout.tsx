"use client";

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu, GraduationCap, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useEffect } from 'react';
import { notificationEngine } from '@/domain/notifications/engine/LocalNotificationEngine';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Notifications
  const unreadCount = useLiveQuery(() =>
    db.notifications.filter(n => !n.isRead).count()
  ) || 0;

  useEffect(() => {
    notificationEngine.generateNotifications().catch(console.error);
    import('@/repositories/local/LocalNotificationRepository').then(({ LocalNotificationRepository }) => {
      new LocalNotificationRepository().deleteOldNotifications();
    });
  }, []);

  // Derive page title from pathname
  const getPageTitle = () => {
    const segment = pathname?.split('/').filter(Boolean).pop() || 'Dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="flex w-full min-h-[100dvh] overflow-x-hidden">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header — visible below lg */}
        <header className="sticky top-0 z-30 flex lg:hidden items-center h-14 px-4 border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-foreground transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 ml-3 min-w-0">
            <GraduationCap className="h-5 w-5 text-primary shrink-0" />
            <span className="font-heading font-bold text-sm truncate">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-1 ml-auto shrink-0">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                )}
              </Button>
            </Link>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 bg-background min-w-0 overflow-x-hidden">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
