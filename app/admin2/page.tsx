"use client";

import AuthGuard from "../contexts/AuthGuard";
import AdminPage from "../admin/page";

export default function AdminPageWrapper() {
  return (
    <AuthGuard requireAdmin>
      <AdminPage />
    </AuthGuard>
  );
}
