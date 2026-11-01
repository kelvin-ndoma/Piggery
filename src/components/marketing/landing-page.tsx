import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookX,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  FileSpreadsheet,
  HeartPulse,
  History,
  LineChart,
  Menu,
  PawPrint,
  QrCode,
  Scale,
  Shield,
  Smartphone,
  Sprout,
  Stethoscope,
  Sunrise,
  Sunset,
  Syringe,
  Users,
  Warehouse,
  Wheat,
} from "lucide-react";
import { BrandLockup } from "@/components/brand-logo";
import { InquiryForm } from "@/components/marketing/inquiry-form";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BILLING_PLAN_CATALOG, DEFAULT_PLATFORM_SETTINGS } from "@/types/domain";

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#day", label: "On the farm" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

const TRUST = ["Built for Kenya", "Prices in KES", "Weights in kilograms", "Africa/Nairobi time", "Role-based access"] as const;

const BEFORE_AFTER = [
  {
    before: "Serving dates in a notebook that stays in one pocket.",
    after: "Every serving saved with the sow, the boar, and the method. The due date is worked out for you.",
  },
  {
    before: "Counting the herd again to answer a simple question.",
    after: "Today’s numbers come straight from what the team recorded.",
  },
  {
    before: "Vaccines remembered only when someone remembers.",
    after: "Due dates raise an alert for the people who need to act.",
  },
  {
    before: "Feed bought, but nobody is sure where it went.",
    after: "Purchases and use per pen, with a warning before stock runs low.",
  },
] as const;

type Feature = {
  title: string;
  body: string;
  icon: typeof PawPrint;
  tone?: "dark" | "tint";
};

/** Dark and tint cards span two columns in the bento grid. */
const FEATURES: Feature[] = [
  {
    title: "Herd and housing",
    body: "Every pig has an ID, a pen, and a history. Moves are recorded, so the map of the farm stays true.",
    icon: PawPrint,
    tone: "dark",
  },
  {
    title: "Serving and farrowing",
    body: "Log the served-on date and method. Due dates follow this farm’s gestation length.",
    icon: Sprout,
  },
  {
    title: "Litters",
    body: "Births stay with the sow and the piglets that arrived — how many were born alive and how many stillborn.",
    icon: Warehouse,
  },
  {
    title: "Health and vaccines",
    body: "Incidents, treatments, and vaccines sit next to the animal they belong to.",
    icon: Syringe,
  },
  {
    title: "Vet visits",
    body: "Each visit keeps the vet’s findings and recommendations, and the team is told what to do next.",
    icon: Stethoscope,
  },
  {
    title: "Feed and growth",
    body: "Feed use, stock, and weights. Average daily gain is worked out from the weigh-ins.",
    icon: Wheat,
    tone: "tint",
  },
];

const DETAILS = [
  { title: "Find any pig fast", body: "Every pig gets an ID and a QR code. Look it up by ID, QR code, or ear tag.", icon: QrCode },
  { title: "Sensible weights only", body: "Weights that are impossible for this farm are stopped before they save.", icon: Scale },
  { title: "Safe on a weak signal", body: "Sending a form twice does not create the record twice.", icon: Smartphone },
  { title: "History stays history", body: "Workers cannot delete past records. Old events can be entered as historical.", icon: History },
  { title: "Several farms, one login", body: "Switch between the farms you belong to without signing out.", icon: Building2 },
  { title: "Money stays private", body: "Sales, expenses, and feed costs are only shown to the owner and manager.", icon: Shield },
] as const;

const DAY = [
  {
    time: "Morning",
    icon: Sunrise,
    title: "Feed and check the pens",
    body: "A worker records feed per pen from the phone. Stock goes down as it is used.",
  },
  {
    time: "Mid-morning",
    icon: Scale,
    title: "Weigh and move",
    body: "Weigh-ins update growth. Pigs moved to a new pen take their history with them.",
  },
  {
    time: "Afternoon",
    icon: HeartPulse,
    title: "Serving and health",
    body: "Record a serving or a sick pig. The vet sees the incident and logs the treatment.",
  },
  {
    time: "Evening",
    icon: Sunset,
    title: "The owner checks in",
    body: "Home shows today’s counts and what is due. Reports cover any date range.",
  },
] as const;

const ALERTS = [
  { title: "Farrowing due", body: "Sows close to their due date.", icon: Sprout },
  { title: "Vaccines due", body: "Next doses as they come up.", icon: Syringe },
  { title: "Low feed stock", body: "Before a feed runs out.", icon: Wheat },
  { title: "Health incidents", body: "Sick pigs reported by the team.", icon: HeartPulse },
  { title: "Vet recommendations", body: "Follow-ups from a farm visit.", icon: ClipboardList },
] as const;

const REPORTS = [
  "Population",
  "Breeding",
  "Growth",
  "Health",
  "Vaccination",
  "Mortality",
  "Feed",
  "Farm visits",
  "Financial",
  "Dashboard",
] as const;

const STEPS = [
  {
    title: "Request access",
    body: "Tell us the farm name and who should own the workspace. There is no public sign-up.",
  },
  {
    title: "Workspace opens",
    body: "If we accept, that owner email receives a login. Invite the rest of the team from there.",
  },
  {
    title: "Record the day",
    body: "Serving, births, health, feed, and moves are entered as they happen. Home and reports follow.",
  },
] as const;

const ROLES = [
  { name: "Owner", body: "Farm settings, team, money, and the full record." },
  { name: "Manager", body: "Day-to-day records, operations, and costs." },
  { name: "Worker", body: "Enter what happened on the farm." },
  { name: "Vet", body: "Health, treatments, vaccines, and visits." },
  { name: "Viewer", body: "Read-only access for the office." },
] as const;

const PLAN_POINTS: Record<string, readonly string[]> = {
  FREE: ["One farm workspace", "Herd, housing, and daily records", "Owner login"],
  STARTER: ["Everything in Free", "Team roles", "Health, serving, and reports"],
  GROWTH: ["Everything in Starter", "A larger herd and more rooms", "More people on the farm"],
  ENTERPRISE: ["Several farm workspaces", "Quoted pricing", "Onboarding with our team"],
};

const FAQ = [
  {
    q: "Is there a free plan?",
    a: "Yes. The Free plan gives one farm workspace with the herd, housing, and daily records, so you can try it before paying.",
  },
  {
    q: "How do we pay?",
    a: "By M-Pesa, bank transfer, or cash. Payment is confirmed by our team when the workspace is opened. Monthly and yearly billing are both available.",
  },
  {
    q: "Does it work on a phone?",
    a: "Yes. It runs in the phone’s browser, so workers can record feed, weights, and health from the pens. There is nothing to install.",
  },
  {
    q: "Who can see our sales and costs?",
    a: "Only the owner and the farm manager. Workers, vets, and viewers never see money. Permissions are checked on the server, not just hidden in the screen.",
  },
  {
    q: "Can we add records from before we joined?",
    a: "Yes. The owner, manager, and vet can enter past events as historical records, so the history of each pig can be filled in.",
  },
  {
    q: "Can one person work on more than one farm?",
    a: "Yes. One login can belong to several farms, with a different role on each, and switch between them.",
  },
  {
    q: "Why is there no instant sign-up?",
    a: "We open each farm ourselves so the owner account, plan, and settings are right from day one.",
  },
] as const;

const NEXT_STEPS = [
  "We review the farm, usually within a few working days.",
  "The owner email gets the first login.",
  "The owner invites managers, workers, and the vet.",
] as const;

/** Spans the full viewport; gutters grow with it. Text blocks keep their own max widths. */
const WRAP = "w-full px-4 sm:px-6 lg:px-10 2xl:px-16 min-[1920px]:px-24";
const SECTION = "py-16 sm:py-24 2xl:py-32";
const EYEBROW =
  "inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary";
const H2 = "mt-4 text-3xl font-semibold tracking-tight text-balance text-stone-950 sm:text-4xl xl:text-5xl";
const LEAD = "mt-4 text-base leading-7 text-stone-600 sm:text-lg sm:leading-8";

export function LandingPage({ supportEmail }: { supportEmail?: string | null }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f7f5f0] font-sans text-stone-900 antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        <Hero />
        <TrustStrip />
        <BeforeAfter />
        <Product />
        <Details />
        <DayOnTheFarm />
        <AlertsAndReports />
        <HowItWorks />
        <Pricing />
        <Faq />
        <CallToAction />
        <Inquire />
      </main>

      <SiteFooter supportEmail={supportEmail} />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#f7f5f0]/80 backdrop-blur-xl">
      <div className={cn(WRAP, "flex h-16 items-center justify-between gap-3 lg:h-20")}>
        <Link href="/" className="min-w-0 shrink">
          <BrandLockup tone="light" />
        </Link>
        <nav
          className="hidden items-center gap-1 rounded-full border border-stone-200/80 bg-white/70 p-1 text-sm font-medium text-stone-600 shadow-sm lg:flex"
          aria-label="Page"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 transition-colors hover:bg-stone-100 hover:text-stone-950"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="hidden rounded-full min-[400px]:inline-flex">
            <a href="#inquire">Request access</a>
          </Button>
          <details className="relative lg:hidden">
            <summary
              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
              <nav className="grid text-sm font-medium text-stone-700" aria-label="Menu">
                {NAV.map((item) => (
                  <a key={item.href} href={item.href} className="rounded-xl px-3 py-3 hover:bg-stone-100">
                    {item.label}
                  </a>
                ))}
                <Link href="/login" className="rounded-xl px-3 py-3 hover:bg-stone-100">
                  Sign in
                </Link>
                <a href="#inquire" className="mt-1 rounded-xl bg-primary px-3 py-3 text-center text-primary-foreground">
                  Request access
                </a>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1f4d3a26_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-24 h-[28rem] w-[28rem] rounded-full bg-amber-100/70 blur-3xl" />
      <div
        className={cn(
          WRAP,
          "relative grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-24 2xl:gap-24 2xl:py-32",
        )}
      >
        <div className="max-w-2xl 2xl:max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 py-1 pl-1 pr-3 text-xs font-medium text-primary shadow-sm backdrop-blur">
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">Invite-only</span>
            Farm software for pig herds in Kenya
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-stone-950 sm:text-5xl sm:leading-[1.05] xl:text-6xl 2xl:text-7xl">
            Run the whole pig farm from{" "}
            <span className="bg-linear-to-r from-primary via-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              one record
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8 2xl:max-w-2xl 2xl:text-xl 2xl:leading-9">
            Serving, births, health, feed, and housing — recorded by the team as it happens. Today’s counts, alerts,
            and reports come from those records, not a notebook or a spreadsheet.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-full sm:w-auto">
              <a href="#inquire">
                Request access
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full rounded-full bg-white/80 sm:w-auto">
              <a href="#product">See what it does</a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
            {["Free plan available", "Works on any phone", "M-Pesa accepted"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <ProductPreview />
          <FloatingChip className="-left-6 -top-6 hidden xl:flex" icon={Sprout} title="Farrowing due" body="Sow due this week" />
          <FloatingChip className="-bottom-6 -right-2 hidden md:flex" icon={Bell} title="Low feed stock" body="Grower feed" />
        </div>
      </div>
    </section>
  );
}

function FloatingChip({
  className,
  icon: Icon,
  title,
  body,
}: {
  className?: string;
  icon: typeof Bell;
  title: string;
  body: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/90 py-2.5 pl-2.5 pr-4 shadow-[0_20px_50px_-20px_rgba(31,77,58,0.45)] backdrop-blur",
        className,
      )}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-stone-900">{title}</span>
        <span className="block text-xs text-stone-500">{body}</span>
      </span>
    </div>
  );
}

function TrustStrip() {
  return (
    <div className="border-y border-stone-200/80 bg-white/70">
      <ul className={cn(WRAP, "flex flex-wrap items-center gap-x-8 gap-y-2 py-4 text-sm text-stone-500 lg:justify-between")}>
        {TRUST.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BeforeAfter() {
  return (
    <section className="bg-white">
      <div className={cn(WRAP, SECTION)}>
        <div className="mx-auto max-w-3xl text-center">
          <p className={EYEBROW}>Why Piggery</p>
          <h2 className={H2}>The farm already has the answers. They are just scattered.</h2>
          <p className={LEAD}>
            Notebooks, phone photos, and memory. Piggery puts every event in one place, so anyone on the team can find
            it later.
          </p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-2 lg:gap-6">
          {BEFORE_AFTER.map((row) => (
            <div key={row.before} className="grid overflow-hidden rounded-3xl border border-stone-200 sm:grid-cols-2">
              <div className="flex gap-3 bg-stone-50 p-5 sm:p-6">
                <BookX className="mt-0.5 h-5 w-5 shrink-0 text-stone-400" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">Before</p>
                  <p className="mt-1.5 text-sm leading-6 text-stone-500">{row.before}</p>
                </div>
              </div>
              <div className="flex gap-3 bg-primary/[0.04] p-5 sm:p-6">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">With Piggery</p>
                  <p className="mt-1.5 text-sm leading-6 text-stone-800">{row.after}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Product() {
  return (
    <section id="product" className="scroll-mt-20">
      <div className={cn(WRAP, SECTION)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-2xl">
            <p className={EYEBROW}>Product</p>
            <h2 className={H2}>Built for how a pig farm already works</h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-stone-600">
            Kenya Shillings, kilograms, and Africa/Nairobi time out of the box. Each part of the farm has its own page,
            and they all read the same records.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const dark = feature.tone === "dark";
            return (
              <li
                key={feature.title}
                className={cn(
                  "relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8",
                  feature.tone && "sm:col-span-2",
                  dark
                    ? "border-primary bg-primary text-primary-foreground"
                    : feature.tone === "tint"
                      ? "border-emerald-200/70 bg-linear-to-br from-emerald-50 to-white"
                      : "border-stone-200/80 bg-white",
                )}
              >
                {dark ? (
                  <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
                ) : null}
                <span
                  className={cn(
                    "relative inline-flex h-12 w-12 items-center justify-center rounded-2xl",
                    dark ? "bg-white/15 text-white" : "bg-primary/10 text-primary",
                  )}
                >
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className={cn("relative mt-6 text-xl font-semibold", dark ? "text-white" : "text-stone-950")}>
                  {feature.title}
                </h3>
                <p
                  className={cn(
                    "relative mt-2 max-w-md text-sm leading-7 2xl:text-base",
                    dark ? "text-emerald-50/85" : "text-stone-600",
                  )}
                >
                  {feature.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Details() {
  return (
    <section className="border-y border-stone-200/80 bg-white">
      <div className={cn(WRAP, "py-14 sm:py-20")}>
        <h2 className="text-lg font-semibold text-stone-950">The details that matter on a real farm</h2>
        <ul className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {DETAILS.map((item) => (
            <li key={item.title} className="flex gap-4 2xl:flex-col 2xl:gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-[#f7f5f0] text-primary">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-stone-950">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-stone-600">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DayOnTheFarm() {
  return (
    <section id="day" className="relative scroll-mt-20 overflow-hidden bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-emerald-400/20 blur-3xl" />
      <div className={cn(WRAP, SECTION, "relative")}>
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
            A day on the farm
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl xl:text-5xl">
            Everyone records their part. The owner sees the whole day.
          </h2>
        </div>
        <div className="relative mt-14">
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-white/20 xl:block" />
          <ol className="relative grid gap-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
            {DAY.map((step) => (
              <li key={step.time}>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-lg">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">{step.time}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-7 text-emerald-50/80">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function AlertsAndReports() {
  return (
    <section>
      <div className={cn(WRAP, SECTION, "grid gap-6 lg:grid-cols-2")}>
        <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-10">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Bell className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">Alerts before it is too late</h2>
          <p className="mt-3 text-base leading-7 text-stone-600">
            Piggery watches the records and tells the right people when something needs doing.
          </p>
          <ul className="mt-8 divide-y divide-stone-100 rounded-2xl border border-stone-200">
            {ALERTS.map((alert) => (
              <li key={alert.title} className="flex items-center gap-4 px-4 py-3.5">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <alert.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">{alert.title}</p>
                  <p className="text-sm text-stone-500">{alert.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col rounded-3xl border border-stone-200 bg-white p-6 sm:p-10">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <LineChart className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">Reports for any date range</h2>
          <p className="mt-3 text-base leading-7 text-stone-600">
            Ten reports built from the same records the team saves. The owner can download any of them as CSV for the
            accountant or the bank.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {REPORTS.map((report) => (
              <li key={report} className="rounded-full border border-stone-200 bg-[#f7f5f0] px-4 py-2 text-sm font-medium text-stone-700">
                {report}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <div className="flex items-center gap-4 rounded-2xl bg-primary/5 p-4">
              <FileSpreadsheet className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm leading-6 text-stone-700">
                <span className="font-semibold text-stone-900">CSV export.</span> Open it in Excel or Google Sheets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-stone-200/80">
      <div className={cn(WRAP, SECTION)}>
        <div className="max-w-2xl">
          <p className={EYEBROW}>How it works</p>
          <h2 className={H2}>From request to daily records</h2>
        </div>
        <ol className="mt-12 grid gap-4 sm:gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-3xl border border-stone-200/80 bg-white p-6 2xl:p-8">
              <span className="text-5xl font-semibold tracking-tight text-primary/20">0{index + 1}</span>
              <h3 className="mt-4 text-lg font-semibold text-stone-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600 2xl:text-base">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-16">
          <h3 className="text-lg font-semibold text-stone-950">Everyone sees what their role allows</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {ROLES.map((role) => (
              <div key={role.name} className="rounded-2xl border border-stone-200/80 bg-white p-5">
                <div className="flex items-center gap-2 text-primary">
                  {role.name === "Owner" ? (
                    <Shield className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Users className="h-4 w-4" aria-hidden="true" />
                  )}
                  <p className="text-sm font-semibold text-stone-950">{role.name}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">{role.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const currency = DEFAULT_PLATFORM_SETTINGS.billingCurrency;
  return (
    <section id="pricing" className="scroll-mt-20 bg-white">
      <div className={cn(WRAP, SECTION)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-2xl">
            <p className={EYEBROW}>Pricing</p>
            <h2 className={H2}>One farm, one plan</h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-stone-600">
            Prices are in {currency} per farm. Yearly billing is available. Payment is confirmed when the workspace is
            opened — M-Pesa, bank, or cash.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {BILLING_PLAN_CATALOG.map((plan) => {
            const featured = plan.plan === "STARTER";
            const points = PLAN_POINTS[plan.plan] ?? [];
            return (
              <article
                key={plan.plan}
                className={cn(
                  "flex flex-col rounded-3xl border p-6 transition-transform duration-300 hover:-translate-y-1 2xl:p-8",
                  featured
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_30px_80px_-30px_rgba(31,77,58,0.7)]"
                    : "border-stone-200 bg-[#f7f5f0]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-sm font-medium", featured ? "text-emerald-100" : "text-stone-500")}>{plan.name}</p>
                  {featured ? (
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white">Most farms</span>
                  ) : null}
                </div>
                <p className="mt-4 text-4xl font-semibold tracking-tight">
                  {plan.quoted ? "Custom" : formatMoney(plan.monthly, currency)}
                </p>
                <p className={cn("mt-1 text-sm", featured ? "text-emerald-100/80" : "text-stone-500")}>
                  {plan.quoted
                    ? "Priced for your farms"
                    : plan.monthly === 0
                      ? "No payment to start"
                      : `per month · ${formatMoney(plan.yearly, currency)} / year`}
                </p>
                <p className={cn("mt-4 text-sm leading-6", featured ? "text-emerald-50/90" : "text-stone-600")}>{plan.summary}</p>
                <ul className={cn("mt-5 flex-1 space-y-2.5 border-t pt-5", featured ? "border-white/15" : "border-stone-200")}>
                  {points.map((point) => (
                    <li key={point} className="flex gap-2 text-sm leading-6">
                      <Check className={cn("mt-0.5 h-4 w-4 shrink-0", featured ? "text-emerald-100" : "text-primary")} aria-hidden="true" />
                      <span className={featured ? "text-emerald-50" : "text-stone-600"}>{point}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full rounded-full" variant={featured ? "secondary" : "outline"}>
                  <a href="#inquire">Choose {plan.name}</a>
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20">
      <div className={cn(WRAP, SECTION, "grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16")}>
        <div className="max-w-xl">
          <p className={EYEBROW}>FAQ</p>
          <h2 className={H2}>Questions farmers ask</h2>
          <p className={LEAD}>Anything else? Add it to the message in the request form and we will answer.</p>
        </div>
        <div className="divide-y divide-stone-200 self-start rounded-3xl border border-stone-200 bg-white">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 sm:px-8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-stone-950 [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-stone-400 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="-mt-1 pb-5 text-sm leading-7 text-stone-600 sm:text-base">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className={WRAP}>
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 px-6 py-14 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary/60 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl xl:text-5xl">
            Put the notebook down. Keep the history.
          </h2>
          <p className="mt-4 text-base leading-7 text-stone-300 sm:text-lg">
            Start on the Free plan. Move up when the herd and the team grow.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="w-full rounded-full sm:w-auto">
              <a href="#inquire">
                Request access
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <Link href="/login">Sign in to your farm</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Inquire() {
  return (
    <section id="inquire" className="scroll-mt-20">
      <div className={cn(WRAP, SECTION, "grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 2xl:gap-24")}>
        <div className="max-w-xl lg:sticky lg:top-28 lg:self-start lg:pt-4">
          <p className={EYEBROW}>Request access</p>
          <h2 className={H2}>Open a farm workspace</h2>
          <p className={LEAD}>
            Send the farm name and the owner email. If we accept, that address gets the first login. The owner invites
            the team from inside the farm.
          </p>
          <ol className="mt-8 space-y-4">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-stone-700">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-stone-500">
            Already have a login?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <InquiryForm />
      </div>
    </section>
  );
}

function SiteFooter({ supportEmail }: { supportEmail?: string | null }) {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className={cn(WRAP, "grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]")}>
        <div className="max-w-sm space-y-4 sm:col-span-2 lg:col-span-1">
          <BrandLockup tone="light" />
          <p className="text-sm leading-6 text-stone-500">
            Farm software for pig herds in Kenya. Herd, serving, health, feed, and housing in one record.
          </p>
        </div>
        <nav aria-label="Footer" className="text-sm">
          <p className="font-semibold text-stone-900">Product</p>
          <ul className="mt-4 space-y-3 text-stone-500">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:text-stone-900">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-sm">
          <p className="font-semibold text-stone-900">Account</p>
          <ul className="mt-4 space-y-3 text-stone-500">
            <li>
              <Link href="/login" className="hover:text-stone-900">
                Sign in
              </Link>
            </li>
            <li>
              <a href="#inquire" className="hover:text-stone-900">
                Request access
              </a>
            </li>
            {supportEmail ? (
              <li>
                <a href={`mailto:${supportEmail}`} className="break-all hover:text-stone-900">
                  {supportEmail}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-100">
        <p className={cn(WRAP, "py-5 text-xs text-stone-400")}>© {new Date().getFullYear()} Piggery</p>
      </div>
    </footer>
  );
}

const PREVIEW_STATS = [
  { label: "Sows on record", icon: PawPrint },
  { label: "Due to farrow", icon: Sprout },
  { label: "Vaccines due", icon: Syringe },
  { label: "Open health", icon: HeartPulse },
] as const;

const PREVIEW_ROWS = ["Serving due", "Farrowing this week", "Vaccines overdue"] as const;

function ProductPreview() {
  return (
    <div className="w-full min-w-0 rounded-[1.6rem] border border-white/60 bg-white/70 p-2 shadow-[0_40px_100px_-40px_rgba(31,77,58,0.55)] ring-1 ring-stone-200/60 backdrop-blur">
      <div className="overflow-hidden rounded-[1.1rem] bg-[#f7f5f0]">
        <div className="flex items-center gap-2 border-b border-stone-200/80 bg-white px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <p className="ml-2 truncate rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-400">piggery · Today</p>
        </div>
        <div className="grid sm:grid-cols-[9rem_minmax(0,1fr)] 2xl:grid-cols-[11rem_minmax(0,1fr)]">
          <aside className="hidden bg-primary p-4 text-primary-foreground sm:block">
            <p className="text-sm font-semibold">Piggery</p>
            <ul className="mt-5 space-y-1 text-xs text-emerald-100/75 2xl:text-sm">
              <li className="rounded-lg bg-white/15 px-2.5 py-1.5 font-medium text-white">Home</li>
              <li className="px-2.5 py-1.5">Herd</li>
              <li className="px-2.5 py-1.5">Serving</li>
              <li className="px-2.5 py-1.5">Litters</li>
              <li className="px-2.5 py-1.5">Health</li>
              <li className="px-2.5 py-1.5">Feed</li>
              <li className="px-2.5 py-1.5">Reports</li>
            </ul>
          </aside>
          <div className="min-w-0 p-4 sm:p-5 2xl:p-6">
            <p className="text-sm font-semibold text-stone-950 2xl:text-base">Today</p>
            <p className="mt-1 text-xs text-stone-500">Counts stay empty until the farm saves a record.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4 2xl:gap-3">
              {PREVIEW_STATS.map((item) => (
                <div key={item.label} className="min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-3">
                  <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <p className="mt-2 truncate text-[11px] text-stone-500 2xl:text-xs">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-stone-300">—</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-stone-200 bg-white">
              {PREVIEW_ROWS.map((row) => (
                <div key={row} className="flex items-center justify-between gap-3 border-b border-stone-100 px-3 py-2.5 last:border-b-0">
                  <p className="truncate text-xs text-stone-600 2xl:text-sm">{row}</p>
                  <span className="h-2 w-16 shrink-0 rounded-full bg-stone-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
