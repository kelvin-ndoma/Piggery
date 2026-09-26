import { notFound } from "next/navigation";
import { SaleForm } from "@/components/forms/herd-forms";
import { PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { activePigSaleOptions } from "@/services/finance";

export default async function SaleActionPage() {
  const ctx = await requireFarmContext();
  if (!can(ctx.role, "finance:write")) notFound();
  const pigs = await activePigSaleOptions(ctx);
  return (
    <div>
      <PageHeader title="Record sale" description="Saving a sale marks each pig as sold. The pig remains searchable." />
      <SaleForm pigs={pigs} />
    </div>
  );
}
