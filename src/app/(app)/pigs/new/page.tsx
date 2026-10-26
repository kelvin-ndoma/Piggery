import { notFound } from "next/navigation";
import { PigForm } from "@/components/forms/herd-forms";
import { PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { housingOptions } from "@/services/pigs";

export default async function NewPigPage() {
  const ctx = await requireFarmContext();
  if (!can(ctx.role, "pigs:write")) notFound();
  const pens = await housingOptions(ctx);
  return (
    <div>
      <PageHeader title="Add pig" description="Pen, ear tag, breed, source, category, and sex are required. The pig ID is generated when you save." />
      <PigForm pens={pens} />
    </div>
  );
}
