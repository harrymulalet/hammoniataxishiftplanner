
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

  const logout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setUser(null);
      setUserProfile(null);
      setRole(null);
      setLoading(false);
      if (pathname !== '/login') {
         router.push('/login');
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          console.log(`[AuthProvider] Attempting to fetch profile for UID: ${firebaseUser.uid}`);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data();
            if (profileData) {
              const profile = profileData as UserProfile; // Assume type for now
              console.log(`[AuthProvider] Raw profile data found for UID ${firebaseUser.uid}:`, JSON.stringify(profile));

              if (profile.role && (profile.role === 'admin' || profile.role === 'driver')) {
                setUserProfile(profile);
                setRole(profile.role);
                console.log(`[AuthProvider] UID ${firebaseUser.uid} role successfully set to: '${profile.role}'`);
              } else {
                console.warn(`[AuthProvider] Profile for UID ${firebaseUser.uid} exists but has a missing or invalid 'role' field. Role found: '${profile.role}'. Setting session role to null.`);
                setUserProfile(profile); // Still set profile for potential partial data access
                setRole(null);
              }
            } else {
              // This case should ideally not be reached if userDocSnap.exists() is true
              console.error(`[AuthProvider] userDocSnap.data() returned undefined for UID ${firebaseUser.uid} despite document existing. Setting role to null.`);
              setUserProfile(null);
              setRole(null);
            }
            setLoading(false);
          } else {
            console.error(`[AuthProvider] User profile document NOT FOUND in Firestore for UID: ${firebaseUser.uid}. Role will be null. Logging out.`);
            // setUserProfile(null); // Already handled by logout
            // setRole(null); // Already handled by logout
            await logout();
          }
        } catch (error) {
            console.error(`[AuthProvider] Error fetching user profile for UID ${firebaseUser.uid}:`, error);
            // setUserProfile(null); // Already handled by logout
            // setRole(null); // Already handled by logout
            await logout();
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // logout function is stable and doesn't need to be in deps

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
