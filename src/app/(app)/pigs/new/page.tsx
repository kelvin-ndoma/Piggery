import { notFound } from "next/navigation";
import { PigForm } from "@/components/forms/herd-forms";
import { PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { housingOptions, pigOptions } from "@/services/pigs";

export default async function NewPigPage() {
  const ctx = await requireFarmContext();
  if (!can(ctx.role, "pigs:write")) notFound();
  const [pens, pigs] = await Promise.all([housingOptions(ctx), pigOptions(ctx)]);
  return (
    <div>
      <PageHeader title="Add pig" description="Pig IDs are unique on this farm. Leave the ID blank to generate the next one." />
      <PigForm pens={pens} pigs={pigs} showPrice={can(ctx.role, "finance:write")} />
    </div>
  );
}
