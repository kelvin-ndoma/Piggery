import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requirePlatformAdmin } from "@/lib/platform";
import { listPlatformFarms } from "@/services/platform";

export default async function PlatformFarmsPage() {
  await requirePlatformAdmin();
  const farms = await listPlatformFarms();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Farms"
        description="Pause access, update billing, or assign owners for each tenant farm."
        action={{ href: "/platform/farms/new", label: "Add farm tenant" }}
      />

      {farms.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-white/60 px-4 py-10 text-center text-sm text-stone-600">
          No tenant farms yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-stone-50 text-xs uppercase tracking-[0.08em] text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Farm</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Pigs</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((farm) => (
                <tr key={farm.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/platform/farms/${farm.id}`} className="font-medium text-primary hover:underline">
                      {farm.name}
                    </Link>
                    <p className="text-xs text-stone-500">
                      {farm.slug} · {farm.country}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{farm.ownerName ?? "—"}</p>
                    <p className="text-xs text-stone-500">{farm.ownerEmail ?? "Unassigned"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{farm.billing.plan}</p>
                    <p className="text-xs text-stone-500">
                      {farm.billing.amount.toLocaleString()} {farm.billing.currency} ·{" "}
                      {farm.billing.status.replaceAll("_", " ")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        farm.status === "ACTIVE"
                          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                          : farm.status === "PAUSED"
                            ? "inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
                            : "inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800"
                      }
                    >
                      {farm.status === "ACTIVE" ? "Active" : farm.status === "PAUSED" ? "Paused" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{farm.activePigs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
