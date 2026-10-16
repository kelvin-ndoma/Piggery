import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requirePlatformAdmin } from "@/lib/platform";
import { getPlatformOverview } from "@/services/platform";

export default async function PlatformOverviewPage() {
  await requirePlatformAdmin();
  const data = await getPlatformOverview();

  const cards = [
    { label: "Farms", value: data.stats.farms },
    { label: "Active", value: data.stats.activeFarms },
    { label: "Paused", value: data.stats.pausedFarms },
    { label: "Suspended", value: data.stats.suspendedFarms },
    { label: "Past due", value: data.stats.pastDueBilling },
    { label: "Users", value: data.stats.users },
    { label: "Active pigs", value: data.stats.activePigs },
    { label: "Admins", value: data.stats.admins },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform"
        title="Overview"
        description="High-level control across tenant farms, billing, and your platform team."
        action={{ href: "/platform/farms/new", label: "Add farm tenant" }}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent farms</h2>
          <Link href="/platform/farms" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {data.recentFarms.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-white/60 px-4 py-8 text-center text-sm text-stone-600">
            No farms yet. Create the first tenant farm for a farmer.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-stone-50 text-xs uppercase tracking-[0.08em] text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Farm</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Billing</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                </tr>
              </thead>
              <tbody>
                {data.recentFarms.map((farm) => (
                  <tr key={farm.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/platform/farms/${farm.id}`} className="font-medium text-primary hover:underline">
                        {farm.name}
                      </Link>
                      <p className="text-xs text-stone-500">{farm.country}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{farm.ownerName ?? "—"}</p>
                      <p className="text-xs text-stone-500">{farm.ownerEmail ?? "No owner"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{farm.billing.plan}</p>
                      <p className="text-xs text-stone-500">{farm.billing.status.replaceAll("_", " ")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={farm.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-800"
      : status === "PAUSED"
        ? "bg-amber-50 text-amber-900"
        : "bg-rose-50 text-rose-800";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {status === "ACTIVE" ? "Active" : status === "PAUSED" ? "Paused" : "Suspended"}
    </span>
  );
}
