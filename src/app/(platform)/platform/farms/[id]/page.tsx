import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AssignOwnerForm,
  FarmBillingForm,
  FarmStatusControls,
} from "@/components/platform/farm-admin-actions";
import { RecordPaymentForm } from "@/components/platform/record-payment-form";
import { PageHeader } from "@/components/page-header";
import { requirePlatformAdmin } from "@/lib/platform";
import { labelize } from "@/lib/utils";
import { defaultPaidOn, getPlatformFarm } from "@/services/platform";

export default async function PlatformFarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();
  const { id } = await params;
  let farm;
  try {
    farm = await getPlatformFarm(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title={farm.name}
        description={`${farm.slug} · ${farm.country}${farm.locationNote ? ` · ${farm.locationNote}` : ""}`}
      />

      <section className="rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Farm access</h2>
            <p className="mt-1 text-sm text-stone-600">
              Pause temporarily or suspend for non-payment. Only Active farms can sign in and work.
            </p>
          </div>
          <Link href="/platform/farms" className="text-sm font-medium text-primary hover:underline">
            Back to farms
          </Link>
        </div>
        <div className="mt-4">
          <FarmStatusControls farmId={farm.id} status={farm.status} />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Access",
            value: farm.status === "ACTIVE" ? "Active" : farm.status === "PAUSED" ? "Paused" : "Suspended",
          },
          { label: "Billing", value: farm.billing.status.replaceAll("_", " ") },
          { label: "Active pigs", value: String(farm.activePigs) },
          { label: "Team", value: String(farm.team.length) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">{card.label}</p>
            <p className="mt-2 text-lg font-semibold text-stone-950">{card.value}</p>
          </div>
        ))}
      </div>

      <FarmBillingForm farmId={farm.id} billing={farm.billing} />

      <RecordPaymentForm
        farmId={farm.id}
        amount={farm.billing.amount}
        currency={farm.billing.currency}
        paidOn={defaultPaidOn()}
      />

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-base font-semibold">Payments</h2>
        {farm.payments.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">No payments recorded.</p>
        ) : (
          <ul className="mt-3 divide-y text-sm">
            {farm.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="font-medium">
                    {payment.amount.toLocaleString()} {payment.currency} · {payment.method}
                  </p>
                  <p className="text-xs text-stone-500">
                    {payment.paidOn}
                    {payment.reference ? ` · ${payment.reference}` : ""}
                  </p>
                </div>
                <p className="text-xs text-stone-500">{payment.recordedByEmail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-base font-semibold">Current owner</h2>
        {farm.owner ? (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Name</dt>
              <dd className="font-medium">{farm.owner.name}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Email</dt>
              <dd className="font-medium">{farm.owner.email}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Phone</dt>
              <dd className="font-medium">{farm.owner.phone || "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-stone-600">No active owner assigned.</p>
        )}
      </section>

      <AssignOwnerForm farmId={farm.id} />

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-base font-semibold">Team on this farm</h2>
        {farm.team.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">No active members.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {farm.team.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-stone-500">{member.email}</p>
                </div>
                <span className="text-xs text-stone-600">{labelize(member.role)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
