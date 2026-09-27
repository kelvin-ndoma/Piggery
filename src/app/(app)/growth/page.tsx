import { WeightChart } from "@/components/charts/weight-chart";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { formatGain } from "@/lib/format";
import { compareGrowth, summarizeWeights } from "@/services/growth";
import { listLitters } from "@/services/breeding";
import { listHousing } from "@/services/housing";
import { pigOptions } from "@/services/pigs";

export default async function GrowthPage({ searchParams }: { searchParams: Promise<{ pig?: string | string[]; litterId?: string; penId?: string }> }) {
  const ctx = await requireFarmContext();
  const query = await searchParams;
  const selected = Array.isArray(query.pig) ? query.pig : query.pig ? [query.pig] : [];
  const [pigs, litters, housing, series] = await Promise.all([
    pigOptions(ctx),
    listLitters(ctx),
    listHousing(ctx),
    compareGrowth(ctx, {
      pigIds: selected.join(","),
      litterId: query.litterId,
      penId: query.penId,
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Growth" description="Average daily gain is the weight difference divided by the number of days." />
      <form className="space-y-3 rounded-2xl border bg-white p-4" method="get">
        <p className="text-sm font-medium">Compare pigs</p>
        <div className="grid max-h-48 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
          {pigs.slice(0, 40).map((pig) => (
            <label key={pig.value} className="flex min-w-0 items-start gap-2 text-sm">
              <input type="checkbox" name="pig" value={pig.label.split(" ")[0]} defaultChecked={selected.includes(pig.label.split(" ")[0] ?? "")} className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">{pig.label}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select name="litterId" defaultValue={query.litterId ?? ""} className="h-11 rounded-xl border px-3">
            <option value="">Compare a litter</option>
            {litters.map((litter) => <option key={litter.id} value={litter.id}>{litter.litterNumber}</option>)}
          </select>
          <select name="penId" defaultValue={query.penId ?? ""} className="h-11 rounded-xl border px-3">
            <option value="">Compare a pen</option>
            {housing.flatMap((building) => building.pens).map((pen) => <option key={pen.id} value={pen.id}>{pen.code}</option>)}
          </select>
        </div>
        <button className="h-11 rounded-xl bg-primary px-4 text-sm text-primary-foreground">Compare</button>
      </form>
      {series.length === 0 ? <p className="text-sm text-stone-600">Choose pigs, a litter, or a pen to compare weights.</p> : (
        <>
          <WeightChart series={series} />
          <ul className="grid gap-2 sm:grid-cols-2">
            {series.map((item) => {
              const summary = summarizeWeights(item.points);
              return <li key={item.pigId} className="rounded-2xl border bg-white p-3 text-sm">{item.pigId}: {summary.gainKg === null ? "No weights" : `${summary.gainKg} kg gained`} · {formatGain(summary.adgKg)}</li>;
            })}
          </ul>
        </>
      )}
    </div>
  );
}
