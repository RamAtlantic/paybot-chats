"use client";

import { ProtectedRoute } from "@/components/layout/protected-route";

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <div className="h-screen w-full">
        <iframe
          src="/admin/iframe"
          className="w-full h-full border-none"
          title="Admin Chat Interface"
        />
      </div>
    </ProtectedRoute>
  );
}