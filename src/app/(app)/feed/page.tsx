import { FeedRecordForm, FeedTypeForm } from "@/components/forms/ops-forms";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { labelize } from "@/lib/utils";
import { listFeedRecords, listFeedTypes } from "@/services/feed";
import { housingOptions } from "@/services/pigs";

export default async function FeedPage() {
  const ctx = await requireFarmContext();
  const [types, records, pens] = await Promise.all([listFeedTypes(ctx), listFeedRecords(ctx), housingOptions(ctx)]);
  const showCost = can(ctx.role, "finance:read");
  return (
    <div className="space-y-8">
      <PageHeader title="Feed" description="Purchases, consumption, and adjustments are kept as separate records." />
      {types.length === 0 ? <p className="text-sm text-stone-600">No feed types yet.</p> : (
        <RecordTable
          columns={[{ key: "name", label: "Feed" }, { key: "category", label: "Category" }, { key: "stock", label: "On hand" }, ...(showCost ? [{ key: "cost", label: "Cost / kg" }] : []), { key: "low", label: "Stock" }]}
          rows={types.map((type) => ({
            id: type.id,
            cells: {
              name: type.name,
              category: labelize(type.category),
              stock: `${type.quantityKg} kg`,
              cost: showCost ? formatMoney(type.costPerKg, ctx.farm.settings.currency) : "",
              low: type.low ? "Low" : "OK",
            },
          }))}
          empty={{ title: "No feed types yet." }}
        />
      )}
      <RecordTable
        columns={[{ key: "date", label: "Date" }, { key: "feed", label: "Feed" }, { key: "pen", label: "Pen" }, { key: "kind", label: "Kind" }, { key: "qty", label: "Quantity" }, ...(showCost ? [{ key: "cost", label: "Cost" }] : [])]}
        rows={records.map((record) => ({
          id: record.id,
          cells: {
            date: formatDisplayDate(record.date),
            feed: record.feedName,
            pen: record.penCode,
            kind: labelize(record.kind),
            qty: `${record.quantityKg} kg`,
            cost: record.totalCost != null ? formatMoney(record.totalCost, ctx.farm.settings.currency) : "",
          },
        }))}
        empty={{ title: "No feed records yet.", action: can(ctx.role, "feed:write") ? { href: "/actions/feed", label: "Record feed" } : undefined }}
      />
      {can(ctx.role, "feed:write") ? (
        <div className="space-y-4">
          <FeedTypeForm />
          <FeedRecordForm feeds={types.filter((type) => type.isActive).map((type) => ({ value: type.id, label: type.name }))} pens={pens} canPurchase={can(ctx.role, "finance:write")} />
        </div>
      ) : null}
    </div>
  );
}
