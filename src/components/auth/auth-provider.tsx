
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
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profile = userDocSnap.data() as UserProfile;
          setUserProfile(profile);
          setRole(profile.role);
        } else {
          // No profile found, treat as an error or incomplete signup
          console.error("User profile not found in Firestore.");
          setUserProfile(null);
          setRole(null);
          // Optionally sign out the user if profile is mandatory
          // await auth.signOut(); 
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
    setLoading(true);
    await auth.signOut();
    setUser(null);
    setUserProfile(null);
    setRole(null);
    router.push('/login'); // Redirect to login after logout
    setLoading(false);
  };
  
  // Redirect logic based on auth state and role
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);


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
