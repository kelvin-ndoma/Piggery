import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function labelSex(value: string): string {
  if (value === "UNKNOWN") return "Not recorded";
  return labelize(value);
}

export function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function penPurpose(type: string): string {
  if (type === "GROWER") return "Growers";
  if (type === "SOW") return "Sows";
  if (type === "BOAR") return "Boar";
  if (type === "FARROWING") return "Farrowing";
  if (type === "MIXED") return "Mixed";
  return labelize(type);
}

export function servingMethodLabel(method: string): string {
  if (method === "NATURAL") return "Natural service";
  if (method === "ARTIFICIAL_INSEMINATION") return "Artificial insemination";
  return labelize(method);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
