
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
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const profile = userDocSnap.data() as UserProfile;
            setUserProfile(profile);
            setRole(profile.role || null); 
            setLoading(false);
          } else {
            console.error(`User profile not found in Firestore for UID: ${firebaseUser.uid}. Role will be null. Logging out.`);
            await logout(); // Call logout if profile not found
            // setLoading(false) will be handled by logout's finally block
          }
        } catch (error) {
            console.error(`Error fetching user profile for UID ${firebaseUser.uid}:`, error);
            await logout(); // Call logout on error fetching profile
            // setLoading(false) will be handled by logout's finally block
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
