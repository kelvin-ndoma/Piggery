import { PlatformShell } from "@/components/platform/shell";
import { requirePlatformAdmin } from "@/lib/platform";
import { countOpenInquiries } from "@/services/inquiries";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePlatformAdmin();
  const pendingInquiries = await countOpenInquiries();
  return (
    <PlatformShell userName={ctx.userName} userEmail={ctx.userEmail} pendingInquiries={pendingInquiries}>
      {children}
    </PlatformShell>
  );
}
