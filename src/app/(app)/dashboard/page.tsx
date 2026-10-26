import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { QUICK_ACTIONS } from "@/components/layout/nav";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatNumber } from "@/lib/format";
import { dashboardReport } from "@/services/reports";

export default async function DashboardPage() {
  const ctx = await requireFarmContext();
  const data = await dashboardReport(ctx);
  const actions = QUICK_ACTIONS.filter((action) => can(ctx.role, action.permission));

  return (
    <div>
      <PageHeader eyebrow={ctx.farm.name} title="Today on the farm" description="Live counts from recorded pigs and events. Averages stay blank until there is enough history." />
      {ctx.farm.locationNote ? <p className="mb-6 break-words rounded-2xl border bg-white px-4 py-3 text-sm leading-6 text-stone-700">{ctx.farm.locationNote}</p> : null}
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="flex min-h-16 items-center justify-center rounded-2xl bg-primary px-3 text-center text-sm font-medium text-primary-foreground">
            {action.label}
          </Link>
        ))}
      </div>
      {data.registered === 0 ? (
        <EmptyState title="Your farm doesn't have any pigs registered yet." body="Add the first pig to start the herd record." action={can(ctx.role, "pigs:write") ? { href: "/pigs/new", label: "Add your first pig" } : undefined} />
      ) : (
        <div className="space-y-8">
          <Section title="Herd">
            <Card label="Total pigs" value={String(data.herd.total)} hint={data.herd.historical ? `${data.herd.historical} historical` : "Active pigs"} href="/pigs" />
            <Card label="Sows" value={String(data.herd.sows)} href="/pigs?category=SOW" />
            <Card label="Boars" value={String(data.herd.boars)} href="/pigs?category=BOAR" />
            <Card label="Piglets" value={String(data.herd.piglets)} href="/pigs?category=PIGLET" />
            <Card label="Growers" value={String(data.herd.growers)} href="/pigs?category=GROWER" />
            <Card label="Finishers" value={String(data.herd.finishers)} href="/pigs?category=FINISHER" />
          </Section>
          <Section title="Health">
            {data.health ? (
              <>
                <Card label="Healthy" value={String(data.health.healthy)} href="/health" />
                <Card label="Under observation" value={String(data.health.observation)} href="/health" />
                <Card label="Sick" value={String(data.health.sick)} href="/health" />
                <Card label="Critical" value={String(data.health.critical)} href="/health" />
              </>
            ) : (
              <EmptyState title="No health picture yet." />
            )}
          </Section>
          <Section title="Vaccination">
            {data.vaccination ? (
              <>
                <Card label="Due today" value={String(data.vaccination.dueToday)} href="/vaccinations" />
                <Card label="Due this week" value={String(data.vaccination.dueThisWeek)} href="/vaccinations" />
                <Card label="Overdue" value={String(data.vaccination.overdue)} href="/vaccinations" />
              </>
            ) : (
              <EmptyState title="No vaccination records yet." action={can(ctx.role, "health:write") ? { href: "/actions/vaccinate", label: "Record vaccination" } : undefined} />
            )}
          </Section>
          <Section title="Serving">
            {data.breeding.hasRecords ? (
              <>
                <Card label="Pregnant sows" value={String(data.breeding.pregnant)} href="/serving" />
                <Card label="Due to farrow" value={String(data.breeding.expectedFarrowings)} hint={`Within ${ctx.farm.settings.farrowingHorizonDays} days, including any overdue`} href="/serving" />
                <Card label="Births this month" value={String(data.breeding.birthsThisMonth)} hint="Piglets born alive" href="/litters" />
              </>
            ) : (
              <EmptyState title="No serving records yet." action={can(ctx.role, "breeding:write") ? { href: "/actions/serving", label: "Record serving" } : undefined} />
            )}
          </Section>
          <Section title="Feed">
            {data.feed ? (
              <>
                <Card label="Today's consumption" value={`${formatNumber(data.feed.todayKg)} kg`} href="/feed" />
                <Card label="Current inventory" value={`${formatNumber(data.feed.inventoryKg)} kg`} href="/feed" />
                <Card label="Low-stock feed" value={data.feed.low.length ? data.feed.low.map((item) => item.name).join(", ") : "None"} href="/feed" />
              </>
            ) : (
              <EmptyState title="No feed types yet." action={can(ctx.role, "feed:write") ? { href: "/feed", label: "Set up feed" } : undefined} />
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-stone-500">{title}</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Card({ label, value, hint, href }: { label: string; value: string; hint?: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </Link>
  );
}
