"use client";

import { useAuth } from "./useAuth";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, admin, signIn, logOut } = useAuth();

  if (loading)
    return <div className="p-6">Loading...</div>;

  // Not logged in → show sign in
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

  // Logged in but not admin
  if (!admin?.isAdmin) {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        logOut();
        window.location.href = "/";
      }, 1500);
    }

    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl text-red-600">Access Denied</h1>
        <p>You are not authorized to view this page.</p>
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    );
  }

  // Admin → show dashboard
  return <>{children}</>;
}
