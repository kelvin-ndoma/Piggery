"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { goAfterSave } from "@/lib/client-nav";

export function RemoveTeamMemberButton({ userId, name }: { userId: string; name: string }) {
  const [pending, setPending] = useState(false);

  async function onRemove() {
    if (!window.confirm(`Remove ${name} from this farm? They will no longer be able to sign in.`)) return;
    setPending(true);
    try {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const payload = (await response.json()) as { success: boolean; error?: { message: string } };
      if (!payload.success) {
        toast.error(payload.error?.message ?? "Could not remove that team member.");
        setPending(false);
        return;
      }
      toast.success(`${name} was removed from the team.`);
      goAfterSave();
    } catch {
      toast.error("Could not reach the server. Try again.");
    }
    setPending(false);
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={onRemove}>
      {pending ? "Removing..." : "Remove"}
    </Button>
  );
}
