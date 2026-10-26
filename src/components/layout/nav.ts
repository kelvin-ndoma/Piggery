import type { Permission } from "@/types/domain";

export type IconName =
  | "home"
  | "pigs"
  | "health"
  | "breeding"
  | "litters"
  | "syringe"
  | "feed"
  | "visits"
  | "pen"
  | "reports"
  | "bell"
  | "team"
  | "settings"
  | "profile";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  permission?: Permission;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/pigs", label: "Pigs", icon: "pigs" },
  { href: "/health", label: "Health", icon: "health" },
  { href: "/serving", label: "Serving", icon: "breeding" },
  { href: "/litters", label: "Litters", icon: "litters" },
  { href: "/vaccinations", label: "Vaccinations", icon: "syringe" },
  { href: "/feed", label: "Feed", icon: "feed" },
  { href: "/visits", label: "Visits", icon: "visits" },
  { href: "/pens", label: "Pen", icon: "pen" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/notifications", label: "Alerts", icon: "bell" },
  { href: "/team", label: "Team", icon: "team", permission: "users:manage" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export const QUICK_ACTIONS: Array<{ href: string; label: string; permission: Permission }> = [
  { href: "/pigs/new", label: "Add pig", permission: "pigs:write" },
  { href: "/actions/weight", label: "Record weight", permission: "weights:write" },
  { href: "/actions/vaccinate", label: "Vaccinate", permission: "health:write" },
  { href: "/actions/health", label: "Health incident", permission: "health:write" },
  { href: "/actions/feed", label: "Record feed", permission: "feed:write" },
  { href: "/actions/birth", label: "Record birth", permission: "breeding:write" },
  { href: "/actions/serving", label: "Record serving", permission: "breeding:write" },
  { href: "/actions/move", label: "Move pig", permission: "pigs:write" },
  { href: "/visits/new", label: "Farm visit", permission: "visits:write" },
];
