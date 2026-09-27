export function todayInTimeZone(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(start: string, end: string): number {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  return Math.round((endMs - startMs) / 86_400_000);
}

export function monthBounds(isoDate: string): { from: string; to: string } {
  const [year, month] = isoDate.split("-").map(Number);
  const from = `${isoDate.slice(0, 7)}-01`;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${isoDate.slice(0, 7)}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function isValidCurrency(currency: string): boolean {
  try {
    new Intl.NumberFormat("en-KE", { style: "currency", currency });
    return true;
  } catch {
    return false;
  }
}

export function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "Not recorded";
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatAge(dateOfBirth: string | null | undefined, today: string): string {
  if (!dateOfBirth) return "Not recorded";
  const days = daysBetween(dateOfBirth, today);
  if (days < 0) return "Unknown age";
  if (days < 14) return days === 1 ? "1 day" : `${days} days`;
  if (days < 42) {
    const weeks = Math.floor(days / 7);
    const extra = days % 7;
    return extra === 0 ? `${weeks} wk` : `${weeks} wk ${extra} d`;
  }
  const halfMonths = Math.round((days / 30.4375) * 2) / 2;
  return halfMonths === 1 ? "1 month" : `${halfMonths} months`;
}

export function defaultRange(today: string): { from: string; to: string } {
  return { from: addDays(today, -30), to: today };
}
