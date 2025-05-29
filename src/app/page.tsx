
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading, role, logout } = useAuth(); // Ensure logout is destructured
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
          console.warn(`User ${user.uid} logged in but has an invalid/missing role: '${role}'. Logging out and redirecting to login.`);
          logout(); // Explicitly log out the user
          // router.replace('/login'); // logout() in AuthProvider should handle redirecting to /login if not already there.
                                  // If logout itself doesn't redirect reliably, uncommenting this is a backup.
                                  // However, AuthProvider's logout does router.push('/login').
        }
      }
    }
  }, [user, loading, role, router, logout]); // Added logout to dependency array

  // This loader condition handles:
  // 1. Global auth loading state.
  // 2. User is logged in, auth loading is false, but role is not yet determined (or is null).
  //    The useEffect above should eventually log out and redirect if role remains null.
  if (loading || (user && !role && !loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback loader: Shown while the useEffect is processing a redirect
  // or if, for some unexpected reason, none of the above conditions are met.
  // Also handles the brief moment after logout() is called before onAuthStateChanged triggers a rerender.
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

