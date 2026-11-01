import { PLATFORM_SUPERADMIN_EMAIL } from "@/types/domain";

/** Public pages never show the operator login. */
export function publicSupportEmail(email: string | null | undefined): string | null {
  const value = email?.trim() ?? "";
  if (!value) return null;
  if (value.toLowerCase() === PLATFORM_SUPERADMIN_EMAIL.toLowerCase()) return null;
  return value;
}
