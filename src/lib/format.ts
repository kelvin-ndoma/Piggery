import { roundTo } from "@/lib/rules";

export function formatWeight(weightKg: number | null, unit = "KG"): string {
  if (weightKg === null) return "No weight yet";
  const rounded = roundTo(weightKg, weightKg >= 10 ? 1 : 2);
  return `${rounded} ${unit.toLowerCase()}`;
}

export function formatGain(adg: number | null): string {
  if (adg === null) return "Not enough data";
  return `${adg.toFixed(3)} kg/day`;
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: digits }).format(value);
}
