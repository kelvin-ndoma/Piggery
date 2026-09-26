import { IncidentAction } from "@/components/forms/health-forms";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { pigOptions } from "@/services/pigs";

export default async function HealthActionPage({ searchParams }: { searchParams: Promise<{ pig?: string }> }) {
  const ctx = await requireFarmContext();
  const query = await searchParams;
  const pigs = await pigOptions(ctx, { status: "ACTIVE" });
  return (
    <div>
      <PageHeader title="Health incident" description="Record what was observed. The system does not suggest a diagnosis." />
      <IncidentAction pigs={pigs} preset={query.pig} />
    </div>
  );
}
