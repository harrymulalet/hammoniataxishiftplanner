
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useEffect, useState, useCallback } from 'react'; // Added useCallback

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

  const logout = useCallback(async () => {
    // console.log("[AuthProvider] logout called");
    try {
      await auth.signOut();
    } catch (error) {
      console.error("[AuthProvider] Error signing out: ", error);
    } finally {
      setUser(null);
      setUserProfile(null);
      setRole(null);
      setLoading(false); // Logout process is complete, set loading to false.
      if (pathname !== '/login') {
         router.push('/login');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); // router and pathname are stable enough for this context

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // Start loading when auth state changes
      if (firebaseUser) {
        setUser(firebaseUser); // Set Firebase user immediately
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          console.log(`[AuthProvider] Attempting to fetch profile for UID: ${firebaseUser.uid}`);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data() as UserProfile;
            console.log(`[AuthProvider] Raw profile data found for UID ${firebaseUser.uid}:`, JSON.stringify(profileData));

            if (profileData.role && (profileData.role === 'admin' || profileData.role === 'driver')) {
              setUserProfile(profileData);
              setRole(profileData.role);
              console.log(`[AuthProvider] UID ${firebaseUser.uid} role successfully set to: '${profileData.role}'`);
              setLoading(false); // Successfully got profile and valid role
            } else {
              console.warn(`[AuthProvider] Profile for UID ${firebaseUser.uid} exists but has a missing or invalid 'role' field. Role found: '${profileData.role}'. Logging out.`);
              await logout(); // Invalid role, logout will set user/profile/role to null and loading to false
            }
          } else { // Profile document not found
            console.error(`[AuthProvider] User profile document NOT FOUND in Firestore for UID: ${firebaseUser.uid}. Logging out.`);
            await logout(); // No profile, logout will set user/profile/role to null and loading to false
          }
        } catch (error) { // Error fetching profile (e.g., permissions)
          console.error(`[AuthProvider] Error fetching user profile for UID ${firebaseUser.uid}:`, error);
          await logout(); // Error fetching profile, logout will set user/profile/role to null and loading to false
        }
      } else { // No firebaseUser (user is logged out or not logged in initially)
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false); // No user, finished loading
      }
    });

    return () => unsubscribe();
  }, [logout]); // Include logout in dependency array as it's now stable with useCallback

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
