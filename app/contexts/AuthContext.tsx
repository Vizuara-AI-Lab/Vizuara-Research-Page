"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/app/types/user";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import { authService } from "../services/authService";
import { COLLECTION } from "@/app/types/constants";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<User | null>;
  logOut: () => Promise<void>;
  adminChecked: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// 🔹 Fetch Firestore user
const fetchUserFromFirestore = async (uid: string): Promise<User | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION.USERS, uid));
    return snap.exists() ? (snap.data() as User) : null;
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔹 Keep auth state synced
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setAdminChecked(true);
        setLoading(false);
        return;
      }

      // (Optional) If you require emailVerified:
      // if (!firebaseUser.emailVerified) return;

      const userData = await fetchUserFromFirestore(firebaseUser.uid);
      setUser(userData);

      setIsAdmin(userData?.role === "ADMIN");
      setAdminChecked(true);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🔹 Google Sign In
  const signIn = async (): Promise<User | null> => {
    setLoading(true);
    try {
      const response = await authService.signInWithGoogle();

      if (response.success && response.data?.userId) {
        const userData = await fetchUserFromFirestore(response.data.userId);

        setUser(userData);
        setIsAdmin(userData?.role === "ADMIN");
        setAdminChecked(true);
        return userData; // IMPORTANT: return user with role
      }

      return null;
    } catch (err) {
      console.error("Sign-in failed", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Log out
  const logOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setAdminChecked(true);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        logOut,
        adminChecked,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
