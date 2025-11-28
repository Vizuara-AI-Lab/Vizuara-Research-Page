"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. All hooks at the top, always in the same order
  const { user, loading, admin, signIn, logOut, adminChecked } =
    useAuth() as any;
  const router = useRouter();

  // 2. Side-effect: if user is logged in, admin check is done, and NOT admin → schedule logout + redirect
  useEffect(() => {
    if (!loading && adminChecked && user && !admin?.isAdmin) {
      const t = setTimeout(async () => {
        try {
          await logOut();
        } catch (e) {
          console.error("Logout failed", e);
        }
        router.push("/");
      }, 1500);

      return () => clearTimeout(t);
    }
  }, [loading, adminChecked, user, admin?.isAdmin, logOut, router]);

  // 3. Render logic (no new hooks below this point)

  // Still checking auth / admin
  if (loading || !adminChecked) {
    return <div className="p-6">Checking access…</div>;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p>Please sign in using your Google account.</p>
        <button
          onClick={signIn}
          className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // Logged in but not admin (logout+redirect already scheduled in useEffect)
  if (!admin?.isAdmin) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl text-red-600">Access Denied</h1>
        <p>You are not authorized to view this page.</p>
        <p className="text-sm text-gray-500">Redirecting…</p>
      </div>
    );
  }

  // Admin → show children
  return <>{children}</>;
}
