import { Sidebar } from '@/components/layout/Sidebar';
import { getSession } from '@/lib/auth';
import { CopilotChat } from '@/components/copilot/CopilotChat';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Role } from '@prisma/client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  return (
    <NotificationProvider>
      <div className="flex w-full">
        <Sidebar userEmail={user?.email} userRole={user?.role as Role} className="h-screen flex flex-col sticky top-0" />
        <main className="flex-1 overflow-y-auto bg-muted/20 flex flex-col min-h-screen">
          <header className="w-full flex justify-end p-4 border-b border-border/40 bg-white dark:bg-black sticky top-0 z-30">
            <NotificationBell />
          </header>
          <div className="p-4 md:p-8 flex-1">
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </div>
        </main>
        <CopilotChat />
      </div>
    </NotificationProvider>
  );
}


