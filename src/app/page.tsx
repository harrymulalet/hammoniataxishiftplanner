
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading, role, logout } = useAuth(); // Added logout for potential use
  const router = useRouter();

  useEffect(() => {
    if (!loading) { // Only proceed if auth state is resolved
      if (!user) { // No user, go to login
        router.replace('/login');
      } else { // User exists
        if (role === 'admin') {
          router.replace('/admin/drivers');
        } else if (role === 'driver') {
          router.replace('/dashboard');
        } else {
          // User exists, loading is false, but role is not 'admin' or 'driver' (e.g., null due to missing profile/role field).
          console.warn(`User ${user.uid} logged in but has an invalid/missing role: '${role}'. Redirecting to login.`);
          // Consider calling logout() here if you want to clear the session for users with bad profiles,
          // to prevent potential loops if /login also tries to redirect them back.
          // For now, just redirecting to login.
          router.replace('/login');
        }
      }
    }
  }, [user, loading, role, router]); // logout was removed from deps for now, can be added if used

  // This loader condition handles:
  // 1. Global auth loading state.
  // 2. User is logged in, auth loading is false, but role is not yet determined (or is null).
  //    The useEffect above should eventually redirect if role remains null.
  if (loading || (user && !role && !loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback loader: Shown while the useEffect is processing a redirect
  // or if, for some unexpected reason, none of the above conditions are met.
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
