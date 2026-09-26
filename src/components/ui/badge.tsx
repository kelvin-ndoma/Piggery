import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-900",
  SOLD: "bg-stone-200 text-stone-800",
  DEAD: "bg-rose-100 text-rose-900",
  TRANSFERRED: "bg-sky-100 text-sky-900",
  CULLED: "bg-amber-100 text-amber-950",
  LOW: "bg-stone-100 text-stone-700",
  MEDIUM: "bg-amber-100 text-amber-950",
  HIGH: "bg-orange-100 text-orange-950",
  CRITICAL: "bg-rose-100 text-rose-900",
  OPEN: "bg-amber-100 text-amber-950",
  UNDER_TREATMENT: "bg-sky-100 text-sky-900",
  RECOVERED: "bg-emerald-100 text-emerald-900",
  REFERRED: "bg-violet-100 text-violet-900",
  CLOSED: "bg-stone-200 text-stone-700",
  PENDING: "bg-amber-100 text-amber-950",
  CONFIRMED_PREGNANT: "bg-emerald-100 text-emerald-900",
  NOT_PREGNANT: "bg-stone-200 text-stone-700",
  FARROWED: "bg-sky-100 text-sky-900",
  FAILED: "bg-rose-100 text-rose-900",
  GOOD: "bg-emerald-100 text-emerald-900",
  FAIR: "bg-amber-100 text-amber-950",
  NEEDS_ATTENTION: "bg-rose-100 text-rose-900",
  DONE: "bg-emerald-100 text-emerald-900",
  IN_PROGRESS: "bg-sky-100 text-sky-900",
  CANCELLED: "bg-stone-200 text-stone-700",
};

export function Badge({ value, className }: { value: string; className?: string }) {
  const label = value.toLowerCase().replaceAll("_", " ");
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize", tones[value] ?? "bg-stone-100 text-stone-700", className)}>
      {label}
    </span>
  );
}
