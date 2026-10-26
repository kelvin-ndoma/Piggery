import { PensBoard } from "@/components/pens/pens-board";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { listHousing } from "@/services/housing";
import { pigOptions } from "@/services/pigs";

export default async function PensPage() {
  const ctx = await requireFarmContext();
  const [buildings, sows] = await Promise.all([
    listHousing(ctx),
    pigOptions(ctx, { status: "ACTIVE", sex: "FEMALE" }),
  ]);
  const canEdit = can(ctx.role, "housing:write");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950">Pens</h1>
          <p className="mt-1 text-sm text-stone-600">A pen is a block and a number, like A-1. Grower pens show age and mother.</p>
        </div>
      </div>
      <PensBoard initial={buildings} canEdit={canEdit} sows={sows} />
    </div>
  );
}
