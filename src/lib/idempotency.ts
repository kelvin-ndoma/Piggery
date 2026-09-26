import "server-only";
import type { Model } from "mongoose";
import { duplicateField } from "@/lib/errors";

export async function createIdempotent<T>(
  create: () => Promise<T>,
  recover: () => Promise<T | null>,
): Promise<T> {
  try {
    return await create();
  } catch (error) {
    if (duplicateField(error) === "clientTransactionId") {
      const existing = await recover();
      if (existing) return existing;
    }
    throw error;
  }
}

export async function findByTransaction<T>(
  model: Model<T>,
  farmId: unknown,
  clientTransactionId?: string,
): Promise<T | null> {
  if (!clientTransactionId) return null;
  return model.findOne({ farmId, clientTransactionId }).lean<T>();
}
