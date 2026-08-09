import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Toaster } from '@/components/ui/toaster';

export function FullLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full min-w-0">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
