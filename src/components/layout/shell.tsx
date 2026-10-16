"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  ClipboardList,
  HeartPulse,
  House,
  LineChart,
  Menu,
  PawPrint,
  Plus,
  QrCode,
  Receipt,
  Settings,
  Sprout,
  Syringe,
  UserRound,
  Users,
  Warehouse,
  Wheat,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLockup, BrandLogo } from "@/components/brand-logo";
import type { IconName } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<IconName, LucideIcon> = {
  home: House,
  pigs: PawPrint,
  health: HeartPulse,
  growth: LineChart,
  breeding: Sprout,
  litters: PawPrint,
  syringe: Syringe,
  feed: Wheat,
  visits: ClipboardList,
  housing: Warehouse,
  sales: Receipt,
  expenses: Receipt,
  reports: LineChart,
  bell: Bell,
  scan: QrCode,
  team: Users,
  settings: Settings,
  profile: UserRound,
};

export type ShellLink = { href: string; label: string; icon: IconName };

export function AppShell({
  role,
  userName,
  unread,
  demo,
  links,
  actions,
  children,
}: {
  role: string;
  userName: string;
  unread: number;
  demo: boolean;
  links: ShellLink[];
  actions: Array<{ href: string; label: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState<"more" | "record" | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const mobile = [
    links.find((link) => link.href === "/dashboard"),
    links.find((link) => link.href === "/pigs"),
    links.find((link) => link.href === "/health"),
  ].filter((link): link is ShellLink => Boolean(link));

  return (
    <div className="min-h-dvh overflow-x-clip">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-emerald-950/30 bg-primary text-primary-foreground md:flex">
        <div className="border-b border-white/10 px-4 py-4">
          <Link href="/dashboard" className="block rounded-xl outline-none ring-offset-2 ring-offset-primary focus-visible:ring-2 focus-visible:ring-white/40">
            <BrandLockup />
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
          {links.map((link) => {
            const Icon = ICONS[link.icon];
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                  active
                    ? "bg-white/15 font-medium text-white"
                    : "text-emerald-50/85 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-80")} />
                <span className="truncate">{link.label}</span>
                {link.href === "/notifications" && unread > 0 ? (
                  <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary">
                    {unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-4 py-3">
          <p className="truncate text-xs text-emerald-100/70">
            {userName} · {role.toLowerCase().replaceAll("_", " ")}
          </p>
        </div>
      </aside>
      <div className="min-w-0 max-w-full md:pl-60">
        <header className="app-header sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-[#f7f4ee]/95 px-3 py-2 backdrop-blur md:h-16 md:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/dashboard" className="shrink-0 md:hidden" aria-label="Piggery home">
              <BrandLogo variant="mark" className="h-9 w-9" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold md:hidden">Piggery</p>
              <p className="truncate text-xs text-stone-500 md:hidden">
                {userName} · {role.toLowerCase().replaceAll("_", " ")}
              </p>
              <p className="hidden truncate text-sm text-stone-600 md:block">
                {userName} · {role.toLowerCase().replaceAll("_", " ")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link href="/scan" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white" aria-label="Scan pig">
              <QrCode className="h-4 w-4" />
            </Link>
            <Link href="/notifications" className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white" aria-label="Alerts">
              <Bell className="h-4 w-4" />
              {unread > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-600" /> : null}
            </Link>
            <Link
              href="/profile"
              className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm"
              aria-label="Profile"
            >
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </div>
        </header>
        {demo ? (
          <p className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-950 md:px-8">
            Development demo data. Replace it with this farm&apos;s own records.
          </p>
        ) : null}
        <main className="app-main min-w-0 px-4 py-5 pb-28 md:px-8 md:py-6 md:pb-10">{children}</main>
      </div>
      <nav className="app-tabbar fixed inset-x-0 bottom-0 z-30 border-t bg-white md:hidden">
        <div className="grid h-16 grid-cols-5">
          {mobile.slice(0, 2).map((link) => (
            <MobileLink key={link.href} link={link} active={pathname.startsWith(link.href)} />
          ))}
          <button type="button" className="flex h-full w-full flex-col items-center justify-center text-primary" onClick={() => setOpen("record")}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-[11px]">Record</span>
          </button>
          {mobile.slice(2, 3).map((link) => (
            <MobileLink key={link.href} link={link} active={pathname.startsWith(link.href)} />
          ))}
          <button type="button" className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-stone-600" onClick={() => setOpen("more")}>
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
      {open ? (
        <div className="fixed inset-0 z-40 bg-stone-950/40 md:hidden" onClick={() => setOpen(null)}>
          <div className="app-sheet absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{open === "record" ? "Record" : "More"}</h2>
              <button type="button" className="inline-flex h-11 w-11 items-center justify-center" onClick={() => setOpen(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(open === "record" ? actions.map((action) => ({ ...action, icon: "home" as IconName })) : links).map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(null)} className="flex min-h-14 items-center rounded-2xl border px-3 text-sm font-medium">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileLink({ link, active }: { link: ShellLink; active: boolean }) {
  const Icon = ICONS[link.icon];
  return (
    <Link href={link.href} className={cn("flex h-full flex-col items-center justify-center gap-1 px-1 text-[11px]", active ? "text-primary" : "text-stone-500")}>
      <Icon className="h-5 w-5" />
      {link.label}
    </Link>
  );
}
