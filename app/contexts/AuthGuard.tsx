"use client";

import { useAuth } from "./AuthContext";
import { db } from "../lib/firebaseClient";
import { COLLECTION, USER_ROLE } from "@/app/types/constants";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  message?: string;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  message = "Please login to access this page",
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading: authLoading } = useAuth();

  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // ---------------------------
  // Check Admin Role if Needed
  // ---------------------------
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!requireAdmin) {
        setIsAdmin(true);
        setAdminChecked(true);
        return;
      }

      if (user) {
        try {
          const snap = await getDoc(doc(db, COLLECTION.USERS, user.id));
          const data = snap.data();
          const ok = data?.role === USER_ROLE.ADMIN;

          setIsAdmin(ok);
          setAdminChecked(true);
        } catch (err) {
          setIsAdmin(false);
          setAdminChecked(true);
        }
      } else {
        setAdminChecked(true);
      }
    };

    checkAdminRole();
  }, [requireAdmin, user]);

  // ---------------------------
  // Handle redirect logic
  // ---------------------------
  useEffect(() => {
    if (authLoading || !adminChecked) return;

    // If login is required but no user
    if (requireAuth && !user) {
      router.push(`/login?redirect=${pathname}`);
      return;
    }

    // If admin page but user is not admin
    if (requireAdmin && !isAdmin) {
      router.push("/unauthorized");
      return;
    }
  }, [authLoading, adminChecked, user, isAdmin]);

  // ---------------------------
  // Loading UI
  // ---------------------------
  if (authLoading || !adminChecked) {
    return <div className="p-4">Validating permissions...</div>;
  }

  // ---------------------------
  // Final Authorized Render
  // ---------------------------
  return <>{children}</>;
}
