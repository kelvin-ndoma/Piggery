import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { listVisits } from "@/services/visits";

export default async function VisitsPage() {
  const ctx = await requireFarmContext();
  const visits = await listVisits(ctx);
  return (
    <div>
      <PageHeader title="Farm visits" action={can(ctx.role, "visits:write") ? { href: "/visits/new", label: "New visit" } : undefined} />
      <RecordTable
        columns={[{ key: "visit", label: "Visit" }, { key: "date", label: "Date" }, { key: "farmer", label: "Farmer" }, { key: "officer", label: "Officer" }, { key: "tasks", label: "Open tasks" }]}
        rows={visits.map((visit) => ({
          id: visit.id,
          cells: {
            visit: <Link className="font-medium text-primary" href={`/visits/${visit.id}`}>{visit.visitNumber}</Link>,
            date: formatDisplayDate(visit.date),
            farmer: visit.farmerName,
            officer: visit.visitingOfficer,
            tasks: String(visit.openTasks),
          },
        }))}
        empty={{ title: "No farm visits yet.", action: can(ctx.role, "visits:write") ? { href: "/visits/new", label: "Record a visit" } : undefined }}
      />
    </div>
  );
}
