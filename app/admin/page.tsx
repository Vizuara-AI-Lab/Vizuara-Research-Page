"use client";

import AuthGuard from "../contexts/AuthGuard";
import AdminPage from "../adminDashboard/page";

export default function AdminPageWrapper() {
  return (
    <AuthGuard requireAdmin>
      <AdminPage />
    </AuthGuard>
  );
}
