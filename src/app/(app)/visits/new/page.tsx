import { VisitForm } from "@/components/forms/ops-forms";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { herdSummaryText } from "@/services/reports";
import { teamOptions } from "@/services/team";

export default async function NewVisitPage() {
  const ctx = await requireFarmContext();
  const [suggestion, users] = await Promise.all([herdSummaryText(ctx), teamOptions(ctx)]);
  return (
    <div>
      <PageHeader title="Farm visit" description="Observation ratings are what the visiting officer records. Recommendations become tasks." />
      <VisitForm suggestion={suggestion} users={users} />
    </div>
  );
}
