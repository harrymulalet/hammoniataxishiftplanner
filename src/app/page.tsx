
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        // User is logged in, now check role
        if (role) { // Ensure role is determined
          if (role === 'admin') {
            router.replace('/admin/drivers'); 
          } else if (role === 'driver') {
            router.replace('/dashboard');
          } else {
            // Fallback if role is unexpected, or logout
            console.warn("Unknown user role:", role);
            router.replace('/login'); // Or an error page
          }
        }
        // If role is not yet determined but user is logged in, the loading screen will persist
        // due to the outer `if (loading || (user && !role))` condition below.
      }
    }
  }, [user, loading, role, router]);

  if (loading || (user && !role && !loading)) { // Show loading if: global loading, or user exists but role not yet fetched (and not in global loading state)
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // This content will briefly show if not loading and no user before redirect effect runs.
  // Or if user is logged in, role determined, and redirect is happening.
  // Better to always show loader until redirect is complete.
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
