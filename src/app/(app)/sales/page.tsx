import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { listSales } from "@/services/finance";

export default async function SalesPage() {
  const ctx = await requireFarmContext();
  if (!can(ctx.role, "finance:read")) notFound();
  const sales = await listSales(ctx);
  return (
    <div>
      <PageHeader title="Sales" action={can(ctx.role, "finance:write") ? { href: "/actions/sale", label: "Record sale" } : undefined} />
      <RecordTable
        columns={[{ key: "date", label: "Date" }, { key: "buyer", label: "Buyer" }, { key: "pigs", label: "Pigs" }, { key: "amount", label: "Amount" }]}
        rows={sales.map((sale) => ({ id: sale.id, cells: { date: formatDisplayDate(sale.date), buyer: sale.buyerName, pigs: sale.pigs, amount: formatMoney(sale.totalAmount, sale.currency) } }))}
        empty={{ title: "No sales yet.", action: can(ctx.role, "finance:write") ? { href: "/actions/sale", label: "Record sale" } : undefined }}
      />
    </div>
  );
}
