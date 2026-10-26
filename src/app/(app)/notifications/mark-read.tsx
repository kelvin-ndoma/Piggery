"use client";

import { goAfterSave } from "@/lib/client-nav";

export function MarkRead({ id, href, read }: { id: string; href: string | null; read: boolean }) {
  async function open() {
    await fetch(`/api/notifications/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    goAfterSave(href ?? undefined);
  }
  return (
    <button type="button" className="mt-3 text-sm font-medium text-primary" onClick={open}>
      {read ? "Open" : "Mark read"}
    </button>
  );
}
