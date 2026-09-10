import { AcademicNav } from '@/components/academic/AcademicNav';

export default function AcademicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Academic Center</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your semesters, subjects, attendance, and track academic health.</p>
      </div>

      <AcademicNav />

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
