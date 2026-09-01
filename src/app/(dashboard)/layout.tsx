import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-8">
        <div className="mx-auto max-w-7xl w-full">
          {children}
        </div>
      </main>
    </>
  );
}
