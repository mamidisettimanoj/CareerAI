"use client";

import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full">
      <Sidebar className="h-screen flex flex-col sticky top-0" />
      <main className="flex-1 overflow-y-auto bg-muted/20 flex flex-col min-h-screen">
        <div className="p-4 md:p-8 flex-1">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
