import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { listLitters } from "@/services/breeding";

export default async function LittersPage() {
  const ctx = await requireFarmContext();
  const litters = await listLitters(ctx);
  return (
    <div>
      <PageHeader title="Litters" action={can(ctx.role, "breeding:write") ? { href: "/actions/birth", label: "Record birth" } : undefined} />
      <RecordTable
        columns={[{ key: "litter", label: "Litter" }, { key: "born", label: "Born" }, { key: "mother", label: "Mother" }, { key: "alive", label: "Born alive" }, { key: "now", label: "Currently alive" }]}
        rows={litters.map((litter) => ({
          id: litter.id,
          cells: {
            litter: <Link className="font-medium text-primary" href={`/litters/${litter.id}`}>{litter.litterNumber}</Link>,
            born: formatDisplayDate(litter.birthDate),
            mother: litter.mother,
            alive: String(litter.bornAlive),
            now: String(litter.currentlyAlive),
          },
        }))}
        empty={{ title: "No litters yet.", action: can(ctx.role, "breeding:write") ? { href: "/actions/birth", label: "Record birth" } : undefined }}
      />
    </div>
  );
}
