
"use client";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // User is logged in, redirect from auth pages
      if (role === 'admin') {
        router.replace('/admin/drivers');
      } else if (role === 'driver') {
        router.replace('/dashboard');
      } else {
        // Role not determined yet, or unknown role, stay or redirect to a generic dashboard
        // This case should ideally be handled by the main redirect logic too
        router.replace('/'); 
      }
    }
  }, [user, loading, role, router]);

  if (loading || (!loading && user)) {
    // Show loading spinner if auth state is loading OR if user is logged in (as redirect is in progress)
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not loading and no user, show the auth page content (e.g., Login form)
  return <>{children}</>;
}
