import { BuildingForm, PenForm } from "@/components/forms/ops-forms";
import { PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { labelize } from "@/lib/utils";
import { listHousing } from "@/services/housing";

export default async function HousingPage() {
  const ctx = await requireFarmContext();
  const buildings = await listHousing(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title="Housing" description="Farm, building, pen, then pig." />
      {buildings.length === 0 ? <p className="text-sm text-stone-600">No buildings yet.</p> : buildings.map((building) => (
        <section key={building.id} className="rounded-2xl border bg-white p-4">
          <h2 className="font-semibold">{building.code} · {building.name}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {building.pens.map((pen) => (
              <article key={pen.id} className="min-w-0 break-words rounded-xl border p-3 text-sm">
                <p className="font-medium">{pen.code} · {pen.name}</p>
                <p className="text-stone-500">{labelize(pen.type)} · {pen.occupied}{pen.capacity ? ` / ${pen.capacity}` : ""} pigs{pen.plannedFeedKgPerDay != null ? ` · ${pen.plannedFeedKgPerDay} kg/day planned` : ""}</p>
                {pen.notes ? <p className="mt-1 text-stone-600">{pen.notes}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
      {can(ctx.role, "housing:write") ? (
        <div className="space-y-4">
          <BuildingForm />
          <PenForm buildings={buildings.filter((building) => building.isActive).map((building) => ({ value: building.id, label: `${building.code} · ${building.name}` }))} />
        </div>
      ) : null}
    </div>
  );
}
