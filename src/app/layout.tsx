// src/app/layout.tsx

import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/auth-provider';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/contexts/LanguageContext'; // Added

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ShiftCycle - Taxi Shift Planner', // This could also be translated if needed server-side
  description: 'Efficiently manage your taxi shifts with ShiftCycle.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Default lang, will be updated by LanguageProvider */}
        <LanguageProvider> {/* Added */}
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </LanguageProvider> {/* Added */}
      </body></html>
  );
}
