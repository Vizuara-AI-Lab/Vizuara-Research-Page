"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/app/types/user";


import { collection, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { UserRole } from "@/app/types/general";
import { db } from "../lib/firebaseClient";
import { authService } from "../services/authService";
import {COLLECTION} from "@/app/types/constants";
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
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

// 🔹 Helper: fetch Firestore user
const fetchUserFromFirestore = async (uid: string): Promise<User | null> => {
  try {
    const docRef = doc(db, COLLECTION.USERS, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as User;
    return null;
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

  // 🔹 Keep user in sync with Firebase Auth state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser || !firebaseUser.emailVerified) {
        setUser(null);
        setLoading(false);
        setAdminChecked(true);
        setIsAdmin(false);
        return;
      }

      const userData = await fetchUserFromFirestore(firebaseUser.uid);
      setUser(userData);

      // check admin role
      const adminRole = userData?.role === "ADMIN";
      setIsAdmin(adminRole);
      setAdminChecked(true);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🔹 Google Sign In
  const signIn = async () => {
    setLoading(true);
    try {
      const response = await authService.signInWithGoogle();

      if (response.success && response.data?.userId) {
        const userData = await fetchUserFromFirestore(response.data.userId);
        setUser(userData);

        const adminRole = userData?.role === "ADMIN";
        setIsAdmin(adminRole);
      }
    } catch (err) {
      console.error("Sign-in failed", err);
    } finally {
      setLoading(false);
      setAdminChecked(true);
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
      setLoading(false);
      setAdminChecked(true);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    logOut,
    adminChecked,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
