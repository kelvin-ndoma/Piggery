import Link from "next/link";
import { notFound } from "next/navigation";
import { AcceptInquiryForm, DeclineInquiryForm } from "@/components/platform/inquiry-review";
import { PageHeader } from "@/components/page-header";
import { catalogLabel } from "@/lib/billing-catalog";
import { requirePlatformAdmin } from "@/lib/platform";
import { labelize } from "@/lib/utils";
import { getFarmInquiry } from "@/services/inquiries";

export default async function PlatformInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();
  const { id } = await params;
  let inquiry;
  try {
    inquiry = await getFarmInquiry(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Inquiry"
        title={inquiry.farmName}
        description={`${inquiry.name} · ${inquiry.email}`}
      />
      <p>
        <Link href="/platform/inquiries" className="text-sm font-medium text-primary hover:underline">
          Back to inquiries
        </Link>
      </p>
      <section className="rounded-2xl border bg-white p-4 shadow-sm md:p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Status</dt>
            <dd className="font-medium">{labelize(inquiry.status)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Plan asked</dt>
            <dd className="font-medium">
              {catalogLabel(inquiry.plan)} · {inquiry.cycle.toLowerCase()}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Phone</dt>
            <dd className="font-medium">{inquiry.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Country</dt>
            <dd className="font-medium">{inquiry.country}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Location</dt>
            <dd className="font-medium">{inquiry.locationNote || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Herd note</dt>
            <dd className="font-medium">{inquiry.herdNote || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Message</dt>
            <dd className="font-medium">{inquiry.message || "—"}</dd>
          </div>
          {inquiry.reviewNote ? (
            <div className="sm:col-span-2">
              <dt className="text-stone-500">Review note</dt>
              <dd className="font-medium">{inquiry.reviewNote}</dd>
            </div>
          ) : null}
        </dl>
      </section>
      {inquiry.status === "OPEN" ? (
        <>
          <AcceptInquiryForm inquiryId={inquiry.id} plan={inquiry.plan} cycle={inquiry.cycle} />
          <DeclineInquiryForm inquiryId={inquiry.id} />
        </>
      ) : inquiry.farmId ? (
        <Link href={`/platform/farms/${inquiry.farmId}`} className="text-sm font-medium text-primary hover:underline">
          Open farm tenant
        </Link>
      ) : null}
    </div>
  );
}
