/** Only same-origin app paths. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  if (value.startsWith("/login") || value.startsWith("/api")) return null;
  return value;
}

/** Send a signed-in user to a safe `next` path, or their home. */
export function homeAfterLogin(homePath: string, nextPath: string | null | undefined): string {
  const next = safeNextPath(nextPath);
  if (!next) return homePath;
  if (homePath === "/platform") {
    return next.startsWith("/platform") ? next : homePath;
  }
  if (homePath === "/dashboard" && !next.startsWith("/platform") && !next.startsWith("/no-access")) {
    return next;
  }
  return homePath;
}
