import { PageHeader } from "@/components/page-header";
import { ScanClient } from "@/app/(app)/scan/scan-client";

export default function ScanPage() {
  return (
    <div>
      <PageHeader title="Scan a pig" description="Opens the pig and the quick actions for weight, health, feed, and movement." />
      <ScanClient />
    </div>
  );
}
