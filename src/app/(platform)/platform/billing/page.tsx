import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requirePlatformAdmin } from "@/lib/platform";
import { listBillingFarms } from "@/services/platform";

export default async function PlatformBillingPage() {
  await requirePlatformAdmin();
  const data = await listBillingFarms();

  const cards = [
    { label: "Current", value: data.summary.current },
    { label: "Trial", value: data.summary.trial },
    { label: "Past due", value: data.summary.pastDue },
    { label: "Paused", value: data.summary.paused },
    {
      label: "Est. monthly",
      value: Math.round(data.summary.monthlyRecurring).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Billing"
        description="Manual billing ledger for now. Update each farm’s plan, amount, and payment status from the farm page."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-stone-50 text-xs uppercase tracking-[0.08em] text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Farm</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Billing</th>
              <th className="px-4 py-3 font-medium">Next / paid</th>
              <th className="px-4 py-3 font-medium">Access</th>
            </tr>
          </thead>
          <tbody>
            {data.farms.map((farm) => (
              <tr key={farm.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/platform/farms/${farm.id}`} className="font-medium text-primary hover:underline">
                    {farm.name}
                  </Link>
                  <p className="text-xs text-stone-500">{farm.ownerEmail ?? "No owner"}</p>
                </td>
                <td className="px-4 py-3">{farm.billing.plan}</td>
                <td className="px-4 py-3">
                  {farm.billing.amount.toLocaleString()} {farm.billing.currency}
                  <p className="text-xs text-stone-500">{farm.billing.cycle.toLowerCase()}</p>
                </td>
                <td className="px-4 py-3">{farm.billing.status.replaceAll("_", " ")}</td>
                <td className="px-4 py-3 text-xs text-stone-600">
                  <p>Next: {farm.billing.nextBillingOn ?? "—"}</p>
                  <p>Paid: {farm.billing.paidThroughOn ?? "—"}</p>
                </td>
                <td className="px-4 py-3">{farm.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
