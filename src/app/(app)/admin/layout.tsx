
"use client";

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/dashboard'); // Or '/' which redirects to login or driver dashboard
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center"> {/* Adjust height if Navbar is present */}
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
     // This case should ideally be caught by the useEffect redirect,
    // but as a fallback, show loader while redirecting.
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider> {/* Wrap with SidebarProvider */}
      <div className="flex h-[calc(100vh-4rem)]"> {/* Adjust height for Navbar */}
        <AdminSidebar />
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-muted/30">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
