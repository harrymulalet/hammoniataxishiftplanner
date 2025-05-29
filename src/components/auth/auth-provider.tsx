
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useEffect, useState } from 'react';

import { auth, db } from '@/lib/firebase';
import type { UserProfile, UserRole } from '@/lib/types';

export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user profile from Firestore to get the role
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const profile = userDocSnap.data() as UserProfile;
            setUserProfile(profile);
            setRole(profile.role || null); // Ensure role is null if undefined in profile
          } else {
            // No profile found, treat as an error or incomplete signup
            console.error(`User profile not found in Firestore for UID: ${firebaseUser.uid}. Role will be null.`);
            setUserProfile(null);
            setRole(null);
            // Optionally sign out the user if profile is mandatory
            // await auth.signOut();
            // setUser(null); // if signing out
          }
        } catch (error) {
            console.error(`Error fetching user profile for UID ${firebaseUser.uid}:`, error);
            setUserProfile(null);
            setRole(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true); // Indicate loading during logout process
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setUser(null);
      setUserProfile(null);
      setRole(null);
      // No need to setLoading(true) then false here, onAuthStateChanged will handle it.
      // The setLoading(false) in onAuthStateChanged will fire after user becomes null.
      // Explicitly ensure loading is false after state clear if not relying on onAuthStateChanged immediately.
      setLoading(false); 
      if (pathname !== '/login') { // Avoid pushing to login if already there or if onAuthStateChanged will handle redirect via page.tsx
         router.push('/login'); // Redirect to login after logout
      }
    }
  };
  
  // General redirect logic for unauthenticated users was removed from here
  // as it's better handled by AppLayout and AuthLayout for their specific contexts.
  // The `page.tsx` also handles the initial routing decision.

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        loading,
        isAdmin: role === 'admin',
        isDriver: role === 'driver',
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
