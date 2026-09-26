import { MoveAction } from "@/components/forms/herd-forms";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { housingOptions, pigOptions } from "@/services/pigs";

export default async function MovePage({ searchParams }: { searchParams: Promise<{ pig?: string }> }) {
  const ctx = await requireFarmContext();
  const query = await searchParams;
  const [pigs, pens] = await Promise.all([pigOptions(ctx, { status: "ACTIVE" }), housingOptions(ctx)]);
  return (
    <div>
      <PageHeader title="Move pig" description="Sold, dead, transferred, and culled pigs stay where their history left them." />
      <MoveAction pigs={pigs} pens={pens} preset={query.pig} />
    </div>
  );
}
