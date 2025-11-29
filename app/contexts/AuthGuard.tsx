"use client";

import { doc, getDoc } from "firebase/firestore";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { db } from "../lib/firebaseClient";
import { COLLECTION } from "../types/constants";

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
  message?: string;
}

export default function AuthGuard({
  children,
  requireAdmin = false,
  message = "Access denied",
}: AuthGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        router.push("/auth");
        return;
      }

      if (!requireAdmin) {
        setIsAdmin(true);
        return;
      }

      try {
        const snap = await getDoc(doc(db, COLLECTION.USERS, user.id));
        const data = snap.data();
        setIsAdmin(data?.role === "ADMIN");
      } catch {
        setIsAdmin(false);
      }
    };

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading, requireAdmin, router]);

  // Loading while checking auth/admin
  if (authLoading || isAdmin === null) return <p>Loading...</p>;
  console.log({ isAdmin });
  // Not allowed
  if (requireAdmin && !isAdmin) {
    return <p>{message}</p>;
  }

  return <>{children}</>;
}
