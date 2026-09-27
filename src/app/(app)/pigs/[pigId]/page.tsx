import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { WeightChart } from "@/components/charts/weight-chart";
import { AddPigletForm, DirectWeightForm, EditPigForm, ExitForm } from "@/components/forms/herd-forms";
import { IncidentStatusForm } from "@/components/forms/health-forms";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { formatGain, formatMoney, formatWeight } from "@/lib/format";
import { labelSex, labelize } from "@/lib/utils";
import { AppError } from "@/lib/errors";
import { getPigDetail, housingOptions, pigOptions } from "@/services/pigs";
import type { SelectOption } from "@/types/api";

const TABS = ["overview", "growth", "health", "vaccinations", "feeding", "movement", "breeding", "family", "timeline"] as const;

export default async function PigPage({
  params,
  searchParams,
}: {
  params: Promise<{ pigId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await requireFarmContext();
  const { pigId } = await params;
  const query = await searchParams;
  const tab = TABS.includes(query.tab as (typeof TABS)[number]) ? (query.tab as (typeof TABS)[number]) : "overview";
  let detail;
  try {
    detail = await getPigDetail(ctx, pigId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const { pig } = detail;
  const canEdit = can(ctx.role, "pigs:write");
  const needsChoices = canEdit && (tab === "overview" || (tab === "family" && pig.sex === "FEMALE"));
  let females: SelectOption[] = [];
  let males: SelectOption[] = [];
  let pens: SelectOption[] = [];
  if (needsChoices) {
    [females, males, pens] = await Promise.all([
      pigOptions(ctx, { status: "ACTIVE", sex: "FEMALE" }),
      pigOptions(ctx, { status: "ACTIVE", sex: "MALE" }),
      housingOptions(ctx),
    ]);
  }
  const quick = [
    can(ctx.role, "weights:write") ? { href: `/actions/weight?pig=${pig.id}`, label: "Record weight" } : null,
    can(ctx.role, "health:write") ? { href: `/actions/vaccinate?pig=${pig.id}`, label: "Vaccinate" } : null,
    can(ctx.role, "health:write") ? { href: `/actions/health?pig=${pig.id}`, label: "Health incident" } : null,
    can(ctx.role, "feed:write") ? { href: "/actions/feed", label: "Feed" } : null,
    can(ctx.role, "pigs:write") ? { href: `/actions/move?pig=${pig.id}`, label: "Move" } : null,
    { href: `/pigs/${pig.pigId}?tab=timeline`, label: "View history" },
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  return (
    <div>
      <p className="text-sm text-stone-500">QR {pig.qrCode}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{pig.pigId}</h1>
        <Badge value={pig.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:gap-3 md:grid-cols-4">
        <Meta label="Sex" value={labelSex(pig.sex)} />
        <Meta label="Breed" value={pig.breed} />
        <Meta label="Age" value={pig.ageLabel} />
        <Meta label="Weight" value={formatWeight(pig.weightKg, ctx.farm.settings.weightUnit)} />
        <Meta label="Pen" value={pig.penLabel ?? "No pen"} />
        <Meta label="Category" value={labelize(pig.category)} />
        <Meta label="Daily gain" value={formatGain(pig.adgKg)} />
        <Meta label="Born" value={formatDisplayDate(pig.dateOfBirth)} />
      </dl>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {quick.map((item) => (
          <Link key={item.label} href={item.href} className="inline-flex h-11 shrink-0 items-center rounded-xl bg-primary px-3 text-sm text-primary-foreground">
            {item.label}
          </Link>
        ))}
      </div>
      <div className="-mx-4 mt-2 flex gap-1 overflow-x-auto border-b px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((item) => (
          <Link key={item} href={`/pigs/${pig.pigId}?tab=${item}`} className={`inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-sm capitalize ${tab === item ? "border-primary text-primary" : "border-transparent text-stone-500"}`}>
            {item}
          </Link>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {tab === "overview" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Info title="Identity" lines={[`Ear tag: ${pig.earTag ?? "—"}`, `Source: ${labelize(pig.source)}`, pig.litterNumber ? `Litter: ${pig.litterNumber}` : "No litter link", pig.notes || "No notes"]} />
            <Info title="Parents" lines={[`Mother: ${pig.mother?.pigId ?? "—"}`, `Father: ${pig.father?.pigId ?? "—"}`]} />
            {pig.acquisition ? <Info title="Acquisition" lines={[pig.acquisition.date ?? "", pig.acquisition.supplier ?? "", pig.acquisition.price != null ? formatMoney(pig.acquisition.price, ctx.farm.settings.currency) : ""].filter(Boolean)} /> : null}
            {canEdit && pig.status === "ACTIVE" ? <ExitForm pigRef={pig.id} /> : null}
          </div>
        ) : null}
        {tab === "overview" && canEdit ? (
          <EditPigForm
            pigRef={pig.id}
            females={females.filter((item) => item.value !== pig.id)}
            males={males.filter((item) => item.value !== pig.id)}
            values={{
              earTag: pig.earTag ?? "",
              sex: pig.sex,
              breed: pig.breed,
              dateOfBirth: pig.dateOfBirth ?? "",
              source: pig.source,
              category: pig.category,
              notes: pig.notes,
              motherId: pig.mother?.id ?? "",
              fatherId: pig.father?.id ?? "",
            }}
          />
        ) : null}
        {tab === "growth" ? (
          <>
            {detail.weights.length > 1 ? <WeightChart series={[{ pigId: pig.pigId, points: detail.weights }]} /> : <p className="text-sm text-stone-500">Record at least two weights to see a chart and daily gain.</p>}
            <RecordTable columns={[{ key: "date", label: "Date" }, { key: "weight", label: "Weight" }, { key: "by", label: "Recorded by" }]} rows={detail.weights.map((weight) => ({ id: weight.id, cells: { date: formatDisplayDate(weight.date), weight: `${weight.weightKg} kg`, by: weight.recordedByName } }))} empty={{ title: "No weights yet.", action: can(ctx.role, "weights:write") ? { href: `/actions/weight?pig=${pig.id}`, label: "Record weight" } : undefined }} />
            {can(ctx.role, "weights:write") && pig.status === "ACTIVE" ? <DirectWeightForm pigRef={pig.id} /> : null}
          </>
        ) : null}
        {tab === "health" ? (
          <>
            {detail.mortality ? <Info title="Mortality" lines={[formatDisplayDate(detail.mortality.date), `Age ${detail.mortality.ageDays} days`, detail.mortality.suspectedCause, detail.mortality.confirmedCause, detail.mortality.notes].filter(Boolean)} /> : null}
            {detail.incidents.map((incident) => (
              <article key={incident.id} className="rounded-2xl border bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge value={incident.severity} />
                  <Badge value={incident.status} />
                  <span className="text-sm text-stone-500">{formatDisplayDate(incident.date)}</span>
                </div>
                <p className="mt-2 text-sm">{incident.symptoms}</p>
                {can(ctx.role, "health:write") ? <div className="mt-3"><IncidentStatusForm id={incident.id} status={incident.status} /></div> : null}
              </article>
            ))}
            {detail.incidents.length === 0 && !detail.mortality ? <p className="text-sm text-stone-500">No health incidents yet.</p> : null}
            <h3 className="pt-2 font-medium">Treatments</h3>
            <RecordTable columns={[{ key: "date", label: "Date" }, { key: "product", label: "Product" }, { key: "dose", label: "Dose" }]} rows={detail.treatments.map((item) => ({ id: item.id, cells: { date: formatDisplayDate(item.date), product: item.product, dose: item.dose } }))} empty={{ title: "No treatments yet.", action: can(ctx.role, "health:write") ? { href: "/actions/treatment", label: "Record treatment" } : undefined }} />
          </>
        ) : null}
        {tab === "vaccinations" ? (
          <RecordTable columns={[{ key: "date", label: "Date" }, { key: "vaccine", label: "Vaccine" }, { key: "dose", label: "Dose" }, { key: "due", label: "Next due" }]} rows={detail.vaccinations.map((item) => ({ id: item.id, cells: { date: formatDisplayDate(item.date), vaccine: item.vaccine, dose: item.dose, due: item.nextDueDate ? formatDisplayDate(item.nextDueDate) : "—" } }))} empty={{ title: "No vaccination records yet.", action: can(ctx.role, "health:write") ? { href: `/actions/vaccinate?pig=${pig.id}`, label: "Record vaccination" } : undefined }} />
        ) : null}
        {tab === "feeding" ? (
          <>
            <p className="text-sm text-stone-600">Feed is recorded by pen. These are consumption records for the current pen since the latest move.</p>
            <RecordTable columns={[{ key: "date", label: "Date" }, { key: "feed", label: "Feed" }, { key: "qty", label: "Quantity" }]} rows={detail.feed.map((item) => ({ id: item.id, cells: { date: formatDisplayDate(item.date), feed: item.feedName, qty: `${item.quantityKg} kg` } }))} empty={{ title: "No pen feed records for this stay.", action: can(ctx.role, "feed:write") ? { href: "/actions/feed", label: "Record feed" } : undefined }} />
          </>
        ) : null}
        {tab === "movement" ? (
          <RecordTable columns={[{ key: "date", label: "Date" }, { key: "from", label: "From" }, { key: "to", label: "To" }, { key: "reason", label: "Reason" }]} rows={detail.movements.map((item) => ({ id: item.id, cells: { date: formatDisplayDate(item.date), from: item.fromLabel, to: item.toLabel, reason: labelize(item.reason) } }))} empty={{ title: "No movements yet." }} />
        ) : null}
        {tab === "breeding" ? (
          <>
            <RecordTable columns={[{ key: "date", label: "Date" }, { key: "role", label: "Role" }, { key: "partner", label: "Partner" }, { key: "status", label: "Status" }, { key: "due", label: "Expected farrow" }]} rows={detail.breeding.map((item) => ({ id: item.id, cells: { date: formatDisplayDate(item.date), role: item.role, partner: item.partner, status: <Badge value={item.status} />, due: formatDisplayDate(item.expectedFarrowDate) } }))} empty={{ title: "No breeding records for this pig.", action: pig.sex === "FEMALE" && can(ctx.role, "breeding:write") ? { href: `/actions/breeding?sow=${pig.id}`, label: "Record breeding" } : undefined }} />
            {pig.sex === "FEMALE" && can(ctx.role, "breeding:write") && detail.breeding.length > 0 ? <Link className="inline-flex h-11 items-center text-sm font-medium text-primary" href={`/actions/breeding?sow=${pig.id}`}>Record breeding</Link> : null}
          </>
        ) : null}
        {tab === "family" ? (
          <>
            <RecordTable columns={[{ key: "pig", label: "Pig" }, { key: "sex", label: "Sex" }, { key: "born", label: "Born" }, { key: "status", label: "Status" }]} rows={detail.offspring.map((child) => ({ id: child.id, cells: { pig: <Link className="text-primary" href={`/pigs/${child.pigId}`}>{child.pigId}</Link>, sex: labelSex(child.sex), born: formatDisplayDate(child.dateOfBirth), status: <Badge value={child.status} /> } }))} empty={{ title: "No offspring recorded." }} />
            {pig.sex === "FEMALE" && canEdit ? (
              <AddPigletForm motherId={pig.id} breed={pig.breed} penId={pig.penId ?? ""} boars={males} pens={pens} />
            ) : null}
            {pig.sex === "FEMALE" && can(ctx.role, "breeding:write") ? <Link className="inline-flex h-11 items-center text-sm font-medium text-primary" href={`/actions/birth?sow=${pig.id}`}>Record a full litter</Link> : null}
          </>
        ) : null}
        {tab === "timeline" ? (
          detail.timeline.length === 0 ? (
            <p className="rounded-2xl border bg-white p-4 text-sm text-stone-600">No events recorded yet.</p>
          ) : (
            <ol className="space-y-3">
              {detail.timeline.map((event) => (
                <li key={event.id} className="rounded-2xl border bg-white p-4">
                  <p className="text-xs text-stone-500">{formatDisplayDate(event.date)}</p>
                  <p className="font-medium">{event.title}</p>
                  {event.detail ? <p className="text-sm text-stone-600">{event.detail}</p> : null}
                </li>
              ))}
            </ol>
          )
        ) : null}
        {can(ctx.role, "finance:read") && detail.sales.length > 0 ? (
          <p className="text-sm text-stone-500">Sale: {detail.sales.map((sale) => `${formatDisplayDate(sale.date)} · ${sale.buyerName} · ${formatMoney(sale.amount, ctx.farm.settings.currency)}`).join("; ")}</p>
        ) : null}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 break-words font-medium">{value}</dd>
    </div>
  );
}

function Info({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className="rounded-2xl border bg-white p-4">
      <h2 className="font-medium">{title}</h2>
      <ul className="mt-2 space-y-1 break-words text-sm text-stone-700">{lines.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ul>
    </section>
  );
}
