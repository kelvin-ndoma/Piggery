"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { BrandLockup } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard },
  { href: "/platform/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/platform/farms", label: "Farms", icon: Building2 },
  { href: "/platform/billing", label: "Billing", icon: CreditCard },
  { href: "/platform/admins", label: "Admin team", icon: Users },
  { href: "/platform/settings", label: "Settings", icon: Settings },
  { href: "/platform/farms/new", label: "New farm", icon: Plus },
] as const;

export function PlatformShell({
  userName,
  userEmail,
  pendingInquiries = 0,
  children,
}: {
  userName: string;
  userEmail: string;
  pendingInquiries?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f4f1ea]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-emerald-950/30 bg-primary text-primary-foreground md:flex">
        <div className="border-b border-white/10 px-4 py-4">
          <Link href="/platform" className="block">
            <BrandLockup />
          </Link>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/70">
            Platform admin
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const active =
              link.href === "/platform"
                ? pathname === "/platform"
                : link.href === "/platform/farms"
                  ? pathname === "/platform/farms" ||
                    (pathname.startsWith("/platform/farms/") && !pathname.startsWith("/platform/farms/new"))
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
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
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
                {link.href === "/platform/inquiries" && pendingInquiries > 0 ? (
                  <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary">
                    {pendingInquiries}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-4 py-3">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="truncate text-xs text-emerald-100/70">{userEmail}</p>
          <a
            href="/api/session/reset"
            className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-100/80 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </a>
        </div>
      </aside>

      <div className="min-w-0 max-w-full md:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-[#f7f4ee]/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="min-w-0 md:hidden">
            <Link href="/platform" className="block">
              <BrandLockup tone="light" />
            </Link>
          </div>
          <p className="hidden text-sm text-stone-600 md:block">Tenants · billing · platform team</p>
          <a
            href="/api/session/reset"
            className="inline-flex h-10 items-center rounded-xl border bg-white px-3 text-sm md:hidden"
          >
            Sign out
          </a>
        </header>
        <main className="min-w-0 px-4 py-5 md:px-8 md:py-6">{children}</main>
      </div>
    </div>
  );
}
