import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'CareerAI 2.0',
  description: 'AI-Powered Career Intelligence & University Placement Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="relative flex min-h-screen flex-col bg-background">
          <main className="flex-1 w-full min-w-0 flex flex-col">
            {children}
          </main>
          <Toaster />
        </div>
      </body>
    </html>
  );
}


