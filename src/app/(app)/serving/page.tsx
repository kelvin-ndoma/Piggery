import { BreedingStatusButtons } from "@/components/forms/ops-forms";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { servingMethodLabel } from "@/lib/utils";
import { listBreeding } from "@/services/breeding";

export default async function ServingPage() {
  const ctx = await requireFarmContext();
  const rows = await listBreeding(ctx);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Serving"
        description="When the sow was served, the method, and when she is due to farrow."
        action={can(ctx.role, "breeding:write") ? { href: "/actions/serving", label: "Record serving" } : undefined}
      />
      <RecordTable
        columns={[
          { key: "date", label: "Served on" },
          { key: "sow", label: "Sow" },
          { key: "boar", label: "Boar" },
          { key: "method", label: "Method" },
          { key: "status", label: "Status" },
          { key: "due", label: "Due to farrow" },
          { key: "action", label: "" },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          cells: {
            date: formatDisplayDate(row.breedingDate),
            sow: row.sow,
            boar: row.boar,
            method: servingMethodLabel(row.method),
            status: <Badge value={row.status} />,
            due: formatDisplayDate(row.expectedFarrowDate),
            action:
              can(ctx.role, "breeding:write") && (row.status === "PENDING" || row.status === "CONFIRMED_PREGNANT") ? (
                <BreedingStatusButtons id={row.id} />
              ) : null,
          },
        }))}
        empty={{
          title: "No serving records yet.",
          action: can(ctx.role, "breeding:write") ? { href: "/actions/serving", label: "Record serving" } : undefined,
        }}
      />
    </div>
  );
}
