"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Bell,
  ClipboardList,
  HeartPulse,
  House,
  LineChart,
  LogOut,
  Menu,
  PawPrint,
  Plus,
  QrCode,
  Receipt,
  Settings,
  Sprout,
  Syringe,
  Users,
  Warehouse,
  Wheat,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
};

export type ShellLink = { href: string; label: string; icon: IconName };

export function AppShell({
  farmName,
  role,
  userName,
  unread,
  demo,
  links,
  actions,
  children,
}: {
  farmName: string;
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-primary text-primary-foreground md:flex">
        <div className="px-5 py-6">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">Piggery</p>
          <p className="mt-1 text-lg font-semibold leading-6">{farmName}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {links.map((link) => {
            const Icon = ICONS[link.icon];
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm",
                  active ? "bg-white/15" : "hover:bg-white/10",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
                {link.href === "/notifications" && unread > 0 ? (
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs text-primary">{unread}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 max-w-full md:pl-64">
        <header className="app-header sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-[#f7f4ee]/95 px-3 py-2 backdrop-blur md:h-16 md:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold md:hidden">{farmName}</p>
            <p className="truncate text-xs text-stone-500">
              {userName} · {role.toLowerCase().replaceAll("_", " ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link href="/scan" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white" aria-label="Scan pig">
              <QrCode className="h-4 w-4" />
            </Link>
            <Link href="/notifications" className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white" aria-label="Alerts">
              <Bell className="h-4 w-4" />
              {unread > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-600" /> : null}
            </Link>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
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
