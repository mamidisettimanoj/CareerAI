import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'CareerAI Student OS',
  description: 'The 100% local-first student operating system',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="relative flex min-h-[100dvh] flex-col bg-background overflow-x-hidden">
          <main className="flex-1 w-full min-w-0 flex flex-col">
            {children}
          </main>
          <Toaster />
          <OfflineIndicator />
        </div>
      </body>
    </html>
  );
}


