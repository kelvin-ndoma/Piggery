import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { vaccinationBoard } from "@/services/health";

export default async function VaccinationsPage() {
  const ctx = await requireFarmContext();
  const board = await vaccinationBoard(ctx);
  return (
    <div className="space-y-8">
      <PageHeader title="Vaccinations" action={can(ctx.role, "health:write") ? { href: "/actions/vaccinate", label: "Record vaccination" } : undefined} />
      {!board.hasRecords ? null : (
        <>
          <Due title="Overdue" rows={board.overdue} />
          <Due title="Due today" rows={board.dueToday} />
          <Due title="Due this week" rows={board.dueThisWeek} />
        </>
      )}
      <h2 className="font-medium">Vaccinated recently</h2>
      <RecordTable
        columns={[{ key: "date", label: "Date" }, { key: "pig", label: "Pig" }, { key: "vaccine", label: "Vaccine" }, { key: "dose", label: "Dose" }, { key: "due", label: "Next due" }]}
        rows={board.recent.map((item) => ({ id: item.id, cells: { date: formatDisplayDate(item.date), pig: item.pigId, vaccine: item.vaccine, dose: item.dose, due: item.nextDueDate ? formatDisplayDate(item.nextDueDate) : "—" } }))}
        empty={{ title: "No vaccination records yet.", action: can(ctx.role, "health:write") ? { href: "/actions/vaccinate", label: "Record vaccination" } : undefined }}
      />
    </div>
  );
}

function Due({ title, rows }: { title: string; rows: Array<{ id: string; pigId: string; vaccine: string; nextDueDate: string }> }) {
  return (
    <section>
      <h2 className="mb-2 font-medium">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-stone-500">None.</p> : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border bg-white p-3 text-sm">
              <Link className="font-medium text-primary" href={`/pigs/${row.pigId}?tab=vaccinations`}>{row.pigId}</Link>
              <span className="text-stone-600"> · {row.vaccine} · {formatDisplayDate(row.nextDueDate)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
