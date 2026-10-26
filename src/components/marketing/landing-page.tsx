import Link from "next/link";
import {
  HeartPulse,
  LineChart,
  PawPrint,
  Sprout,
  Syringe,
  Warehouse,
  Wheat,
} from "lucide-react";
import { BrandLockup } from "@/components/brand-logo";
import { InquiryForm } from "@/components/marketing/inquiry-form";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BILLING_PLAN_CATALOG, DEFAULT_PLATFORM_SETTINGS } from "@/types/domain";

const FEATURES = [
  { title: "Herd and housing", body: "Named pigs and grower groups stay in their rooms. Moves stay on the record.", icon: PawPrint },
  { title: "Serving and farrowing", body: "Served-on date and method. Due to farrow follows this farm’s gestation length.", icon: Sprout },
  { title: "Litters", body: "Births stay with the mother and the piglets that arrived.", icon: Warehouse },
  { title: "Health and vaccines", body: "Incidents, treatments, and due dates sit next to the pig they belong to.", icon: Syringe },
  { title: "Feed and weights", body: "Feed use, stock, and weights so growth is history, not a guess.", icon: Wheat },
  { title: "Team and reports", body: "Each role sees only what it is allowed to see. Today’s counts come from saved records.", icon: LineChart },
] as const;

const STEPS = [
  { title: "Ask for a farm", body: "Send the farm name and who should own it. There is no public sign-up." },
  { title: "We review it", body: "A platform admin accepts the inquiry, sets billing, and creates the owner login." },
  { title: "The farm records the day", body: "The owner adds the team. Serving, births, feed, and health are entered as they happen." },
] as const;

const ROLES = ["Owner", "Manager", "Worker", "Vet", "Viewer"] as const;

export function LandingPage({
  appHref,
  appLabel,
  supportEmail,
}: {
  appHref: string;
  appLabel: string;
  supportEmail: string;
}) {
  return (
    <div className="min-h-dvh bg-[#f4f1ea] font-sans text-stone-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f4f1ea]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="min-w-0">
            <BrandLockup tone="light" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-stone-600 lg:flex" aria-label="Page">
            <a href="#records" className="hover:text-stone-950">
              Records
            </a>
            <a href="#start" className="hover:text-stone-950">
              How it starts
            </a>
            <a href="#billing" className="hover:text-stone-950">
              Plans
            </a>
            <a href="#inquire" className="hover:text-stone-950">
              Get a farm
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href={appHref}>{appLabel}</Link>
            </Button>
            <Button asChild>
              <a href="#inquire">Get a farm</a>
            </Button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.18),transparent_50%)]" />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">Pig farm records · Kenya</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
                The farm book that stays with the pigs
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/90 sm:text-lg sm:leading-8">
                Record serving, births, health, feed, and moves. Home shows today’s herd from those records — not from a
                notebook on the wall.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                  <a href="#inquire">Ask for a farm account</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-white/25 bg-transparent text-primary-foreground hover:bg-white/10 sm:w-auto"
                >
                  <Link href={appHref}>{appLabel}</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-emerald-100/70">
                No public registration. A platform admin reviews each inquiry and opens the farm.
              </p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section id="records" className="scroll-mt-24 border-b border-stone-200/80 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">What it covers</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Everything the farm already writes down</h2>
              <p className="mt-3 text-base leading-7 text-stone-600">
                Built for pig farms in Kenya: Kenya Shillings, kilograms, and Africa/Nairobi time.
              </p>
            </div>
            <ul className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-stone-200 bg-stone-200 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="bg-white p-6 sm:p-7">
                  <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold text-stone-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{feature.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="start" className="scroll-mt-24">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">How a farm starts</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Ask. Review. Record.</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-stone-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 rounded-3xl bg-white px-5 py-6 sm:px-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Who uses it</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <li
                    key={role}
                    className="rounded-full border border-stone-200 bg-[#f4f1ea] px-4 py-2 text-sm font-medium text-stone-800"
                  >
                    {role}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="billing" className="scroll-mt-24 border-y border-stone-200/80 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Plans</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Simple list prices</h2>
              <p className="mt-3 text-base leading-7 text-stone-600">
                Amounts are in {DEFAULT_PLATFORM_SETTINGS.billingCurrency}. The admin confirms the figure when the
                inquiry is accepted. Payment is recorded by hand — M-Pesa, bank, or cash.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {BILLING_PLAN_CATALOG.map((plan) => {
                const featured = plan.plan === "STARTER";
                return (
                  <article
                    key={plan.plan}
                    className={cn(
                      "flex flex-col rounded-3xl border p-6",
                      featured ? "border-primary bg-primary text-primary-foreground shadow-lg" : "border-stone-200 bg-[#f4f1ea]",
                    )}
                  >
                    <p className={cn("text-sm font-medium", featured ? "text-emerald-100" : "text-stone-500")}>{plan.name}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">
                      {plan.quoted ? "Quoted" : formatMoney(plan.monthly, DEFAULT_PLATFORM_SETTINGS.billingCurrency)}
                    </p>
                    <p className={cn("mt-1 text-sm", featured ? "text-emerald-100/80" : "text-stone-500")}>
                      {plan.quoted ? "Set when the farm is accepted" : "per month · yearly available"}
                    </p>
                    <p className={cn("mt-4 flex-1 text-sm leading-6", featured ? "text-emerald-50" : "text-stone-600")}>
                      {plan.summary}
                    </p>
                    <Button
                      asChild
                      className="mt-6 w-full"
                      variant={featured ? "secondary" : "outline"}
                    >
                      <a href="#inquire">Choose {plan.name}</a>
                    </Button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="inquire" className="scroll-mt-24 bg-primary text-primary-foreground">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/80">Get a farm</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Tell us about the farm</h2>
              <p className="mt-4 text-base leading-7 text-emerald-50/90">
                Send the farm name and who should be the owner. If we accept, that email gets the first login. Existing
                team members sign in with the email they were given.
              </p>
              <p className="mt-6 text-sm text-emerald-100/75">
                Already have a login?{" "}
                <Link href={appHref} className="font-medium text-white underline underline-offset-4">
                  {appLabel}
                </Link>
              </p>
              <p className="mt-2 text-sm text-emerald-100/75">
                Support:{" "}
                <a className="font-medium text-white underline underline-offset-4" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </p>
            </div>
            <InquiryForm />
          </div>
        </section>
      </main>

      <footer className="bg-[#132e24] text-emerald-100/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-emerald-50">Piggery</p>
          <p>Farm records for pig herds</p>
          <a className="hover:text-white" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        </div>
      </footer>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-[1.7rem] border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-sm">
      <div className="overflow-hidden rounded-[1.25rem] bg-[#f4f1ea] text-stone-900 shadow-inner">
        <div className="flex items-center gap-2 border-b border-stone-200/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <p className="ml-2 text-xs font-medium text-stone-500">Today on the farm</p>
        </div>
        <div className="grid sm:grid-cols-[8.5rem_minmax(0,1fr)]">
          <aside className="hidden bg-primary p-4 text-primary-foreground sm:block">
            <p className="text-sm font-semibold">Piggery</p>
            <ul className="mt-4 space-y-2 text-xs text-emerald-100/80">
              <li className="rounded-lg bg-white/15 px-2 py-1.5 text-white">Home</li>
              <li className="px-2 py-1.5">Pigs</li>
              <li className="px-2 py-1.5">Serving</li>
              <li className="px-2 py-1.5">Health</li>
              <li className="px-2 py-1.5">Feed</li>
            </ul>
          </aside>
          <div className="p-4">
            <p className="text-sm font-semibold">Live counts from saved records</p>
            <p className="mt-1 text-xs text-stone-500">Nothing is guessed. Empty stays empty.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: "Sows", icon: PawPrint },
                { label: "Due to farrow", icon: Sprout },
                { label: "Vaccines due", icon: Syringe },
                { label: "Health", icon: HeartPulse },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
                  <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <p className="mt-2 text-xs text-stone-500">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight">From records</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
