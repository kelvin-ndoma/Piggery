import { BreedingForm } from "@/components/forms/herd-forms";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { pigOptions } from "@/services/pigs";

export default async function ServingActionPage({ searchParams }: { searchParams: Promise<{ sow?: string }> }) {
  const ctx = await requireFarmContext();
  const query = await searchParams;
  const [sows, boars] = await Promise.all([
    pigOptions(ctx, { status: "ACTIVE", sex: "FEMALE" }),
    pigOptions(ctx, { status: "ACTIVE", sex: "MALE" }),
  ]);
  return (
    <div>
      <PageHeader
        title="Record serving"
        description={`Enter the date she was served and the method. Expected farrowing uses this farm's gestation length of ${ctx.farm.settings.gestationDays} days.`}
      />
      <BreedingForm sows={sows} boars={boars} presetSowId={query.sow} />
    </div>
  );
}
