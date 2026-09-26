import { BreedingForm } from "@/components/forms/herd-forms";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { pigOptions } from "@/services/pigs";

export default async function BreedingActionPage() {
  const ctx = await requireFarmContext();
  const [sows, boars] = await Promise.all([
    pigOptions(ctx, { status: "ACTIVE", sex: "FEMALE" }),
    pigOptions(ctx, { status: "ACTIVE", sex: "MALE" }),
  ]);
  return (
    <div>
      <PageHeader title="Record breeding" description={`Expected farrowing uses this farm's gestation length of ${ctx.farm.settings.gestationDays} days.`} />
      <BreedingForm sows={sows} boars={boars} />
    </div>
  );
}
