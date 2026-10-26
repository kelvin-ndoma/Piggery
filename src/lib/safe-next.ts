/** Only same-origin app paths. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  if (value.startsWith("/login") || value.startsWith("/api")) return null;
  return value;
}
