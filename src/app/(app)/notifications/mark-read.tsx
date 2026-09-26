"use client";

import { useRouter } from "next/navigation";

export function MarkRead({ id, href, read }: { id: string; href: string | null; read: boolean }) {
  const router = useRouter();
  async function open() {
    await fetch(`/api/notifications/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (href) router.push(href);
    else router.refresh();
  }
  return (
    <button type="button" className="mt-3 text-sm font-medium text-primary" onClick={open}>
      {read ? "Open" : "Mark read"}
    </button>
  );
}
