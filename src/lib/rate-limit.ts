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

/** Login and public inquiry limits must survive serverless instances. */
export async function rateLimitDurable(key: string, limit: number, windowMs: number): Promise<void> {
  try {
    const { connectDB } = await import("@/lib/db");
    const { RateLimitBucket } = await import("@/models/rate-limit");
    await connectDB();
    const now = new Date();
    const existing = await RateLimitBucket.findOne({ key });
    if (!existing || existing.reset <= now) {
      await RateLimitBucket.findOneAndUpdate(
        { key },
        { $set: { count: 1, reset: new Date(now.getTime() + windowMs) } },
        { upsert: true },
      );
      return;
    }
    const updated = await RateLimitBucket.findOneAndUpdate(
      { key, reset: { $gt: now } },
      { $inc: { count: 1 } },
      { new: true },
    );
    if (!updated) return;
    if (updated.count > limit) {
      throw new AppError("RATE_LIMITED", "Too many requests. Please wait a moment and try again.", 429);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    rateLimit(key, limit, windowMs);
  }
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}
