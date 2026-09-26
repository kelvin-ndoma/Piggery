import { AppError } from "@/lib/errors";

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  if (buckets.size > 5000) buckets.clear();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please wait a moment and try again.", 429);
  }
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}
