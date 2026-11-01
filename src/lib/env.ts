/** Public site origin for Auth.js, Open Graph, and absolute links. */
export function appBaseUrl(): string {
  const explicit = process.env.AUTH_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      // fall through
    }
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

export function assertRuntimeEnv(): void {
  if (!process.env.MONGODB_URI?.trim()) {
    throw new Error("MONGODB_URI is required.");
  }
  if (!process.env.AUTH_SECRET?.trim() || process.env.AUTH_SECRET.length < 16) {
    throw new Error("AUTH_SECRET is required (at least 16 characters).");
  }
  if (process.env.NODE_ENV === "production") {
    const url = process.env.AUTH_URL?.trim() ?? "";
    if (!url || url.includes("localhost") || !url.startsWith("https://")) {
      const message = "AUTH_URL must be the public https origin (not localhost) in production.";
      if (process.env.VERCEL) throw new Error(message);
      console.warn(message);
    }
  }
}
