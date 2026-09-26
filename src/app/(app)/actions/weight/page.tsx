import { WeightAction } from "@/components/forms/herd-forms";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { pigOptions } from "@/services/pigs";

export default async function WeightActionPage({ searchParams }: { searchParams: Promise<{ pig?: string }> }) {
  const ctx = await requireFarmContext();
  const query = await searchParams;
  const pigs = await pigOptions(ctx, { status: "ACTIVE" });
  return (
    <div>
      <PageHeader title="Record weight" description="A new weight is added to the history. It does not replace an earlier measurement." />
      <WeightAction pigs={pigs} preset={query.pig} />
    </div>
  );
}
