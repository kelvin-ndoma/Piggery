import "server-only";
import mongoose from "mongoose";
import { AppError } from "@/lib/errors";

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & { mongooseCache?: Cache };

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new AppError("DATABASE_ERROR", "The database is not configured.", 500);
  }

  if (!globalCache.mongooseCache) {
    globalCache.mongooseCache = { conn: null, promise: null };
  }
  const cache = globalCache.mongooseCache;
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .then((connection) => connection)
      .catch((error: unknown) => {
        cache.promise = null;
        console.error("MongoDB connection failed", error instanceof Error ? error.name : "error");
        throw new AppError("DATABASE_ERROR", "The database is unavailable. Try again shortly.", 500);
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
