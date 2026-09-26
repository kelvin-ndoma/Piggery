import { BreedingStatusButtons } from "@/components/forms/ops-forms";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { listBreeding } from "@/services/breeding";

export default async function BreedingPage() {
  const ctx = await requireFarmContext();
  const rows = await listBreeding(ctx);
  return (
    <div className="space-y-4">
      <PageHeader title="Breeding" description="Pregnancy status is appended. Earlier breeding events stay in place." action={can(ctx.role, "breeding:write") ? { href: "/actions/breeding", label: "Record breeding" } : undefined} />
      <RecordTable
        columns={[{ key: "date", label: "Date" }, { key: "sow", label: "Sow" }, { key: "boar", label: "Boar" }, { key: "status", label: "Status" }, { key: "due", label: "Expected farrow" }, { key: "action", label: "" }]}
        rows={rows.map((row) => ({
          id: row.id,
          cells: {
            date: formatDisplayDate(row.breedingDate),
            sow: row.sow,
            boar: row.boar,
            status: <Badge value={row.status} />,
            due: formatDisplayDate(row.expectedFarrowDate),
            action: can(ctx.role, "breeding:write") && (row.status === "PENDING" || row.status === "CONFIRMED_PREGNANT") ? <BreedingStatusButtons id={row.id} /> : null,
          },
        }))}
        empty={{ title: "No breeding records yet.", action: can(ctx.role, "breeding:write") ? { href: "/actions/breeding", label: "Record breeding" } : undefined }}
      />
    </div>
  );
}
