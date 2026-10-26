import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requirePlatformAdmin } from "@/lib/platform";
import { catalogLabel } from "@/lib/billing-catalog";
import { labelize } from "@/lib/utils";
import { listFarmInquiries } from "@/services/inquiries";

export default async function PlatformInquiriesPage() {
  await requirePlatformAdmin();
  const inquiries = await listFarmInquiries();
  const open = inquiries.filter((item) => item.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Inquiries"
        description="Farms that asked for an account from the public site. Accept to create the tenant and billing, or decline."
      />
      <p className="text-sm text-stone-600">{open} waiting for review</p>
      {inquiries.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-white/60 px-4 py-8 text-center text-sm text-stone-600">
          No inquiries yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-stone-50 text-xs uppercase tracking-[0.08em] text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Farm</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/platform/inquiries/${item.id}`} className="font-medium text-primary hover:underline">
                      {item.farmName}
                    </Link>
                    <p className="text-xs text-stone-500">{item.country}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{item.name}</p>
                    <p className="text-xs text-stone-500">{item.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {catalogLabel(item.plan)}
                    <p className="text-xs text-stone-500">{item.cycle.toLowerCase()}</p>
                  </td>
                  <td className="px-4 py-3">{labelize(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
