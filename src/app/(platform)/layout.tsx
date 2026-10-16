import { PlatformShell } from "@/components/platform/shell";
import { requirePlatformAdmin } from "@/lib/platform";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePlatformAdmin();
  return (
    <PlatformShell userName={ctx.userName} userEmail={ctx.userEmail}>
      {children}
    </PlatformShell>
  );
}
