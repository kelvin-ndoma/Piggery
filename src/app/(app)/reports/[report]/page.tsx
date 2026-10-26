import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { defaultRange } from "@/lib/dates";
import { today } from "@/services/support";
import { breedingReport, feedReport, healthReport, mortalityReport, populationReport, resolveRange, visitReport } from "@/services/reports";
import { vaccinationBoard } from "@/services/health";

const NAMES = ["population", "breeding", "health", "vaccination", "mortality", "feed", "visits"] as const;

export default async function ReportPage({ params, searchParams }: { params: Promise<{ report: string }>; searchParams: Promise<{ from?: string; to?: string }> }) {
  const ctx = await requireFarmContext();
  const { report } = await params;
  if (!NAMES.includes(report as (typeof NAMES)[number])) notFound();
  const query = await searchParams;
  const range = resolveRange(today(ctx), query.from || query.to ? query : defaultRange(today(ctx)));
  const canExport = can(ctx.role, "reports:export");
  const csv = `/api/reports/${report}?from=${range.from}&to=${range.to}&format=csv`;
  return (
    <div className="space-y-4">
      <PageHeader
        title={`${report === "breeding" ? "Serving" : `${report[0]?.toUpperCase()}${report.slice(1)}`} report`}
        action={canExport ? { href: csv, label: "Export CSV" } : undefined}
      />
      {!canExport ? <p className="text-sm text-stone-500">CSV download is limited to the farm owner.</p> : null}
      <form className="grid gap-2 sm:flex sm:flex-wrap" method="get">
        <input type="date" name="from" defaultValue={range.from} className="h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-base sm:w-auto" />
        <input type="date" name="to" defaultValue={range.to} className="h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-base sm:w-auto" />
        <button className="h-11 rounded-xl bg-primary px-4 text-sm text-primary-foreground">Apply</button>
      </form>
      <ReportBody report={report} from={range.from} to={range.to} />
    </div>
  );
}

async function ReportBody({ report, from, to }: { report: string; from: string; to: string }) {
  const ctx = await requireFarmContext();
  if (report === "population") {
    const rows = await populationReport(ctx);
    return <RecordTable columns={[{ key: "pig", label: "Pig" }, { key: "sex", label: "Sex" }, { key: "breed", label: "Breed" }, { key: "category", label: "Category" }, { key: "status", label: "Status" }, { key: "weight", label: "Weight" }]} rows={rows.map((row) => ({ id: row.pigId, cells: { pig: row.pigId, sex: row.sex, breed: row.breed, category: row.category, status: row.status, weight: row.weightKg ?? "—" } }))} empty={{ title: "No pigs in this report." }} />;
  }
  if (report === "health") {
    const rows = await healthReport(ctx, from, to);
    return <RecordTable columns={[{ key: "pig", label: "Pig" }, { key: "date", label: "Date" }, { key: "severity", label: "Severity" }, { key: "status", label: "Status" }, { key: "symptoms", label: "Observed" }]} rows={rows.map((row, index) => ({ id: String(index), cells: row }))} empty={{ title: "No health incidents in this range." }} />;
  }
  if (report === "breeding") {
    const data = await breedingReport(ctx, from, to);
    return <RecordTable columns={[{ key: "litter", label: "Litter" }, { key: "date", label: "Birth" }, { key: "alive", label: "Born alive" }, { key: "still", label: "Stillborn" }, { key: "now", label: "Currently alive" }]} rows={data.litters.map((row) => ({ id: row.litterNumber, cells: { litter: row.litterNumber, date: row.birthDate, alive: row.bornAlive, still: row.stillborn, now: row.currentlyAlive } }))} empty={{ title: "No litters in this range." }} />;
  }
  if (report === "vaccination") {
    const board = await vaccinationBoard(ctx);
    const rows = [...board.overdue, ...board.dueToday, ...board.dueThisWeek, ...board.recent];
    return <RecordTable columns={[{ key: "pig", label: "Pig" }, { key: "vaccine", label: "Vaccine" }, { key: "date", label: "Date" }, { key: "due", label: "Due" }]} rows={rows.map((row) => ({ id: row.id, cells: { pig: row.pigId, vaccine: row.vaccine, date: "date" in row ? row.date : "—", due: row.nextDueDate ?? "—" } }))} empty={{ title: "No vaccination records yet." }} />;
  }
  if (report === "mortality") {
    const rows = await mortalityReport(ctx, from, to);
    return <RecordTable columns={[{ key: "pig", label: "Pig" }, { key: "date", label: "Date" }, { key: "age", label: "Age days" }, { key: "cause", label: "Suspected cause" }]} rows={rows.map((row) => ({ id: `${row.pigId}-${row.date}`, cells: { pig: row.pigId, date: row.date, age: row.ageDays, cause: row.suspectedCause || "—" } }))} empty={{ title: "No mortality records in this range." }} />;
  }
  if (report === "feed") {
    const rows = await feedReport(ctx, from, to);
    return <RecordTable columns={[{ key: "date", label: "Date" }, { key: "feed", label: "Feed" }, { key: "kind", label: "Kind" }, { key: "qty", label: "Kg" }, { key: "cost", label: "Cost" }]} rows={rows.map((row, index) => ({ id: String(index), cells: { date: row.date, feed: row.feed, kind: row.kind, qty: row.quantityKg, cost: row.totalCost ?? "—" } }))} empty={{ title: "No feed records in this range." }} />;
  }
  const visits = await visitReport(ctx, from, to);
  return <RecordTable columns={[{ key: "visit", label: "Visit" }, { key: "date", label: "Date" }, { key: "farmer", label: "Farmer" }, { key: "health", label: "Health" }, { key: "housing", label: "Housing" }]} rows={visits.map((visit) => ({ id: visit.visitNumber, cells: { visit: visit.visitNumber, date: visit.date, farmer: visit.farmerName, health: visit.health, housing: visit.housing } }))} empty={{ title: "No visits in this range." }} />;
}
