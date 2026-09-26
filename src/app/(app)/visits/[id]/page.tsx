import { RecommendationStatusForm } from "@/components/forms/ops-forms";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";
import { getVisit } from "@/services/visits";

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireFarmContext();
  const { id } = await params;
  let visit;
  try {
    visit = await getVisit(ctx, id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const observations = [
    ["Housing", visit.housing],
    ["Health", visit.health],
    ["Water", visit.water],
    ["Feeding", visit.feeding],
    ["Feed quality", visit.feedQuality],
  ] as const;
  return (
    <div className="space-y-6">
      <PageHeader title={visit.visitNumber} description={`${visit.date} · ${visit.farmerName} · ${visit.visitingOfficer}`} />
      <section className="rounded-2xl border bg-white p-4 text-sm">
        <h2 className="font-medium">Pig population</h2>
        <p className="mt-2 whitespace-pre-wrap">{visit.populationSummary}</p>
      </section>
      <div className="grid gap-3 md:grid-cols-2">
        {observations.map(([label, observation]) => (
          <section key={label} className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between"><h2 className="font-medium">{label}</h2><Badge value={observation.rating} /></div>
            <p className="mt-2 text-sm text-stone-600">{observation.notes || "No notes."}</p>
          </section>
        ))}
      </div>
      <section className="space-y-3">
        <h2 className="font-medium">Recommendations</h2>
        {visit.recommendations.length === 0 ? <p className="text-sm text-stone-500">No recommendations on this visit.</p> : visit.recommendations.map((item) => (
          <article key={item.id} className="rounded-2xl border bg-white p-4">
            <div className="flex flex-wrap items-center gap-2"><Badge value={item.priority} /><Badge value={item.status} /><span className="text-sm text-stone-500">{item.assignee}</span></div>
            <p className="mt-2 text-sm">{item.text}</p>
            {can(ctx.role, "visits:write") ? <div className="mt-3"><RecommendationStatusForm id={item.id} /></div> : null}
          </article>
        ))}
      </section>
    </div>
  );
}
