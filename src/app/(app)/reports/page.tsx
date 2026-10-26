import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";

const REPORTS = [
  ["population", "Population"],
  ["breeding", "Serving"],
  ["health", "Health"],
  ["vaccination", "Vaccination"],
  ["mortality", "Mortality"],
  ["feed", "Feed"],
  ["visits", "Farm visits"],
] as const;

export default async function ReportsPage() {
  const ctx = await requireFarmContext();
  return (
    <div>
      <PageHeader
        title="Reports"
        description={
          can(ctx.role, "reports:export")
            ? "Filter by date on each report. Export CSV from the report page."
            : "Filter by date on each report. CSV download is limited to the farm owner."
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(([key, label]) => (
          <Link key={key} href={`/reports/${key}`} className="rounded-2xl border bg-white p-5 font-medium shadow-sm">{label}</Link>
        ))}
      </div>
    </div>
  );
}
