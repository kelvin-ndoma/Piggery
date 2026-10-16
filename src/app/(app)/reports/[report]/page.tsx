import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { WeightChart } from "@/components/charts/weight-chart";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { defaultRange } from "@/lib/dates";
import { today } from "@/services/support";
import { formatMoney } from "@/lib/format";
import { breedingReport, feedReport, financialReport, growthReport, healthReport, mortalityReport, populationReport, resolveRange, visitReport } from "@/services/reports";
import { vaccinationBoard } from "@/services/health";

const NAMES = ["population", "growth", "breeding", "health", "vaccination", "mortality", "feed", "financial", "visits"] as const;

export default async function ReportPage({ params, searchParams }: { params: Promise<{ report: string }>; searchParams: Promise<{ from?: string; to?: string }> }) {
  const ctx = await requireFarmContext();
  const { report } = await params;
  if (!NAMES.includes(report as (typeof NAMES)[number])) notFound();
  if (report === "financial" && !can(ctx.role, "finance:read")) notFound();
  const query = await searchParams;
  const range = resolveRange(today(ctx), query.from || query.to ? query : defaultRange(today(ctx)));
  const canExport = can(ctx.role, "reports:export");
  const csv = `/api/reports/${report}?from=${range.from}&to=${range.to}&format=csv`;
  return (
    <div className="space-y-4">
      <PageHeader
        title={`${report[0]?.toUpperCase()}${report.slice(1)} report`}
        action={canExport ? { href: csv, label: "Export CSV" } : undefined}
      />
      {!canExport ? <p className="text-sm text-stone-500">CSV download is limited to the farm owner.</p> : null}
      <form className="grid gap-2 sm:flex sm:flex-wrap" method="get">
        <input type="date" name="from" defaultValue={range.from} className="h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-base sm:w-auto" />
        <input type="date" name="to" defaultValue={range.to} className="h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-base sm:w-auto" />
        <button className="h-11 rounded-xl bg-primary px-4 text-sm text-primary-foreground">Apply</button>
      </form>
      <ReportBody report={report} from={range.from} to={range.to} currency={ctx.farm.settings.currency} />
    </div>
  );
}

async function ReportBody({ report, from, to, currency }: { report: string; from: string; to: string; currency: string }) {
  const ctx = await requireFarmContext();
  if (report === "population") {
    const rows = await populationReport(ctx);
    return <RecordTable columns={[{ key: "pig", label: "Pig" }, { key: "sex", label: "Sex" }, { key: "breed", label: "Breed" }, { key: "category", label: "Category" }, { key: "status", label: "Status" }, { key: "weight", label: "Weight" }]} rows={rows.map((row) => ({ id: row.pigId, cells: { pig: row.pigId, sex: row.sex, breed: row.breed, category: row.category, status: row.status, weight: row.weightKg ?? "—" } }))} empty={{ title: "No pigs in this report." }} />;
  }
  if (report === "growth") {
    const rows = await growthReport(ctx, from, to);
    const seriesMap = new Map<string, Array<{ date: string; weightKg: number }>>();
    for (const row of rows) {
      const list = seriesMap.get(row.pigId) ?? [];
      list.push({ date: row.date, weightKg: row.weightKg });
      seriesMap.set(row.pigId, list);
    }
    const series = [...seriesMap.entries()].slice(0, 8).map(([pigId, points]) => ({ pigId, points }));
    return (
      <div className="space-y-4">
        {series.length > 0 ? <WeightChart series={series} /> : null}
        <RecordTable columns={[{ key: "pig", label: "Pig" }, { key: "date", label: "Date" }, { key: "weight", label: "Weight" }]} rows={rows.map((row, index) => ({ id: `${row.pigId}-${index}`, cells: { pig: row.pigId, date: row.date, weight: row.weightKg } }))} empty={{ title: "No weights in this range." }} />
      </div>
    );
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
  if (report === "financial") {
    const data = await financialReport(ctx, from, to);
    return (
      <div className="space-y-4">
        <p className="text-sm">Sales {formatMoney(data.salesTotal, currency)} · Expenses {formatMoney(data.expenseTotal, currency)} · Margin {formatMoney(data.margin, currency)}</p>
        <RecordTable columns={[{ key: "date", label: "Date" }, { key: "detail", label: "Detail" }, { key: "amount", label: "Amount" }]} rows={[...data.sales.map((sale) => ({ id: `s-${sale.date}-${sale.buyerName}`, cells: { date: sale.date, detail: sale.buyerName, amount: formatMoney(sale.totalAmount, currency) } })), ...data.expenses.map((expense) => ({ id: `e-${expense.date}-${expense.description}`, cells: { date: expense.date, detail: expense.description, amount: formatMoney(expense.amount, currency) } }))]} empty={{ title: "No financial records in this range." }} />
      </div>
    );
  }
  const visits = await visitReport(ctx, from, to);
  return <RecordTable columns={[{ key: "visit", label: "Visit" }, { key: "date", label: "Date" }, { key: "farmer", label: "Farmer" }, { key: "health", label: "Health" }, { key: "housing", label: "Housing" }]} rows={visits.map((visit) => ({ id: visit.visitNumber, cells: { visit: visit.visitNumber, date: visit.date, farmer: visit.farmerName, health: visit.health, housing: visit.housing } }))} empty={{ title: "No visits in this range." }} />;
}
