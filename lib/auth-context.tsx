"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";
import { setAuthCookies, clearAuthCookies } from "./cookies";

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setAuthCookies(false);
        try {
          const adminDoc = await getDoc(doc(db, "admins", firebaseUser.email!));
          const admin = adminDoc.exists();
          setIsAdmin(admin);
          setAuthCookies(admin);
        } catch {
          setIsAdmin(false);
          setAuthCookies(false);
        }
      } else {
        setIsAdmin(false);
        clearAuthCookies();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (redirectTo = "/dashboard") => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // The proxy reads this cookie; set it before navigating so /dashboard isn't bounced to /login.
      setAuthCookies(false);
      try {
        const adminDoc = await getDoc(doc(db, "admins", result.user.email!));
        if (adminDoc.exists()) setAuthCookies(true);
      } catch {}
      window.location.assign(redirectTo);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
      clearAuthCookies();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
