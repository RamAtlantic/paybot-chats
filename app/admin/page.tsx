"use client"

import { AdminShell } from "@/components/admin/admin-shell"

export default function AdminPage() {
  return (
    <AdminShell
      title="Chats"
      description="Conversaciones activas del chat externo"
      fullBleed
    >
      <div className="h-[calc(100vh-3.5rem)] w-full overflow-hidden border-t border-border">
        <iframe
          src="/admin/iframe"
          className="h-full w-full border-none"
          title="Chat de operación"
        />
      </div>
    </AdminShell>
  )
}
