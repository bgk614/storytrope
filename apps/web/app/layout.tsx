import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NavBar } from '@/components/nav-bar';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'storytrope',
  description: 'A service for registering, voting on, and ranking tropes (clichés) found in books.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        <AuthProvider>
          <NavBar />
          <main className='mx-auto w-full max-w-5xl flex-1 px-4 py-8'>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
