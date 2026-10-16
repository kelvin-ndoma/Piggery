import Link from "next/link";
import { WeightChart } from "@/components/charts/weight-chart";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { formatGain, formatWeight } from "@/lib/format";
import { compareGrowth, summarizeWeights } from "@/services/growth";
import { listLitters } from "@/services/breeding";
import { listHousing } from "@/services/housing";

export default async function GrowthPage({
  searchParams,
}: {
  searchParams: Promise<{ pig?: string | string[]; litterId?: string; penId?: string }>;
}) {
  const ctx = await requireFarmContext();
  const query = await searchParams;
  const selectedPigs = Array.isArray(query.pig) ? query.pig : query.pig ? [query.pig] : [];
  const pigField = selectedPigs.join(", ");
  const hasSelection = Boolean(query.litterId || query.penId || selectedPigs.length);
  const [litters, housing, series] = await Promise.all([
    listLitters(ctx),
    listHousing(ctx),
    compareGrowth(ctx, {
      pigIds: selectedPigs.join(","),
      litterId: query.litterId,
      penId: query.penId,
    }),
  ]);
  const pens = housing.flatMap((building) =>
    building.pens.map((pen) => ({
      id: pen.id,
      label: `${pen.code} · ${pen.name}`,
      occupied: pen.occupied,
    })),
  );
  const mode = query.litterId ? "litter" : query.penId ? "room" : selectedPigs.length ? "pigs" : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Growth" description="See weight history and daily gain for pigs on this farm." />

      <div className="rounded-2xl border bg-white px-4 py-4 text-sm leading-6 text-stone-700">
        <p className="font-medium text-stone-950">How this page works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Choose one way to compare: a room, a litter, or specific pig IDs.</li>
          <li>Press Compare to load the weight chart.</li>
          <li>Daily gain needs at least two weighings for that pig. Until then it stays blank.</li>
        </ol>
      </div>

      <form method="get" className="rounded-2xl border bg-white p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <fieldset className="space-y-2 rounded-xl border border-stone-200 p-4">
            <legend className="px-1 text-sm font-semibold text-stone-950">1. By room</legend>
            <p className="text-sm text-stone-500">Compare active pigs currently in one room.</p>
            <select
              name="penId"
              defaultValue={query.penId ?? ""}
              className="h-11 w-full rounded-xl border bg-white px-3 text-base"
            >
              <option value="">Choose a room</option>
              {pens.map((pen) => (
                <option key={pen.id} value={pen.id}>
                  {pen.label}
                  {pen.occupied ? ` · ${pen.occupied} pigs` : ""}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="space-y-2 rounded-xl border border-stone-200 p-4">
            <legend className="px-1 text-sm font-semibold text-stone-950">2. By litter</legend>
            <p className="text-sm text-stone-500">Compare piglets from one recorded litter.</p>
            <select
              name="litterId"
              defaultValue={query.litterId ?? ""}
              className="h-11 w-full rounded-xl border bg-white px-3 text-base"
            >
              <option value="">Choose a litter</option>
              {litters.length === 0 ? <option value="" disabled>No litters recorded yet</option> : null}
              {litters.map((litter) => (
                <option key={litter.id} value={litter.id}>
                  {litter.litterNumber}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="space-y-2 rounded-xl border border-stone-200 p-4">
            <legend className="px-1 text-sm font-semibold text-stone-950">3. By pig ID</legend>
            <p className="text-sm text-stone-500">Type up to 8 IDs, separated by commas.</p>
            <input
              name="pig"
              defaultValue={pigField}
              placeholder="e.g. G01, G07, S01"
              className="h-11 w-full rounded-xl border bg-white px-3 text-base placeholder:text-stone-400"
            />
          </fieldset>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-500">If more than one is filled, litter is used first, then room, then pig IDs.</p>
          <div className="flex gap-2">
            {hasSelection ? (
              <Link href="/growth" className="inline-flex h-11 items-center justify-center rounded-xl border bg-white px-4 text-sm font-medium">
                Clear
              </Link>
            ) : null}
            <button type="submit" className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground sm:flex-none">
              Compare
            </button>
          </div>
        </div>
      </form>

      {!hasSelection ? (
        <div className="rounded-2xl border border-dashed bg-white/70 px-4 py-12 text-center">
          <p className="font-medium text-stone-950">No comparison yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
            Start with a room if you want to see how growers in that room are doing, for example Room 5 or Room 7.
          </p>
        </div>
      ) : series.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white/70 px-4 py-12 text-center">
          <p className="font-medium text-stone-950">No pigs matched that choice</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
            Check the room, litter, or pig IDs and try again. Weights only appear after they have been recorded.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">Results</h2>
              <p className="text-sm text-stone-500">
                {series.length} pig{series.length === 1 ? "" : "s"}
                {mode === "room" ? " in the selected room" : null}
                {mode === "litter" ? " from the selected litter" : null}
                {mode === "pigs" ? " matching those IDs" : null}
              </p>
            </div>
            <Link href="/actions/weight" className="text-sm font-medium text-primary">
              Record a weight
            </Link>
          </div>

          <WeightChart series={series} />

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {series.map((item) => {
              const summary = summarizeWeights(item.points);
              const first = item.points[0];
              const last = item.points[item.points.length - 1];
              return (
                <li key={item.pigId} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/pigs/${item.pigId}?tab=growth`} className="text-lg font-semibold text-primary">
                      {item.pigId}
                    </Link>
                    <span className="text-xs text-stone-500">
                      {item.points.length} weighing{item.points.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-stone-500">Latest weight</dt>
                      <dd className="mt-0.5 font-medium">
                        {last ? formatWeight(last.weightKg, ctx.farm.settings.weightUnit) : "No weight yet"}
                      </dd>
                      {last ? <dd className="text-xs text-stone-500">{formatDisplayDate(last.date)}</dd> : null}
                    </div>
                    <div>
                      <dt className="text-xs text-stone-500">Daily gain</dt>
                      <dd className="mt-0.5 font-medium">{formatGain(summary.adgKg)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-500">Total gain</dt>
                      <dd className="mt-0.5 font-medium">
                        {summary.gainKg === null ? "Not enough data" : `${summary.gainKg} kg`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-500">First weighing</dt>
                      <dd className="mt-0.5 font-medium">
                        {first ? formatWeight(first.weightKg, ctx.farm.settings.weightUnit) : "—"}
                      </dd>
                      {first ? <dd className="text-xs text-stone-500">{formatDisplayDate(first.date)}</dd> : null}
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
