"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, admin, signIn, logOut, adminChecked, adminLoading } = useAuth();
  const router = useRouter();

  // Side-effect: if user is logged in, admin check is done, and NOT admin → logout + redirect
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

  //  Show loading while checking auth OR checking admin status
  if (loading || !adminChecked || adminLoading) {
    return (
      <div className="p-6 flex items-center gap-2">
        <svg 
          className="animate-spin h-5 w-5 text-gray-500" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Checking access…</span>
      </div>
    );
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