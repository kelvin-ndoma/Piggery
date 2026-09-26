import "server-only";
import { Types, type HydratedDocument } from "mongoose";
import "@/models";
import { todayInTimeZone } from "@/lib/dates";
import { AppError, duplicateField } from "@/lib/errors";
import { toObjectId } from "@/lib/object-id";
import type { FarmContext } from "@/lib/context";
import { AuditLog } from "@/models/operations";
import { Notification } from "@/models/operations";
import { Counter, Pen, type PenDoc } from "@/models/farm";
import { Pig, type PigDoc } from "@/models/pig";
import type { Role } from "@/types/domain";
import { can } from "@/lib/permissions";

export function farmOid(ctx: FarmContext): Types.ObjectId {
  return toObjectId(ctx.farmId, "farm");
}

export function today(ctx: FarmContext): string {
  return todayInTimeZone(ctx.farm.settings.timezone);
}

export function assertNotFuture(date: string, currentDay: string, label: string): void {
  if (date > currentDay) {
    throw new AppError("VALIDATION_ERROR", `${label} cannot be in the future.`, 400);
  }
}

export function actor(ctx: FarmContext) {
  return { recordedById: toObjectId(ctx.userId, "user"), recordedByName: ctx.userName };
}

export async function nextSequence(farmId: Types.ObjectId, key: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { farmId, key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  if (!counter) throw new AppError("DATABASE_ERROR", "Could not allocate an identifier.", 500);
  return counter.seq;
}

export async function findPig(ctx: FarmContext, key: string): Promise<HydratedDocument<PigDoc>> {
  const farmId = farmOid(ctx);
  const code = key.trim();
  if (/^[a-f\d]{24}$/i.test(code)) {
    const byId = await Pig.findOne({ farmId, _id: code });
    if (byId) return byId;
  }
  const pig = await Pig.findOne({
    farmId,
    $or: [{ pigId: code.toUpperCase() }, { qrCode: code.toUpperCase() }, { earTag: code }],
  });
  if (!pig) throw new AppError("NOT_FOUND", "That pig was not found on this farm.", 404);
  return pig;
}

export async function requirePen(ctx: FarmContext, penId: string, active = true): Promise<HydratedDocument<PenDoc>> {
  const pen = await Pen.findOne({ _id: toObjectId(penId, "pen"), farmId: farmOid(ctx) });
  if (!pen || (active && !pen.isActive)) {
    throw new AppError("VALIDATION_ERROR", "Choose a pen on this farm.", 400);
  }
  return pen;
}

export async function writeAudit(
  ctx: FarmContext,
  action: string,
  entity: string,
  entityId: string,
  changes?: Record<string, unknown>,
): Promise<void> {
  try {
    await AuditLog.create({
      farmId: farmOid(ctx),
      userId: toObjectId(ctx.userId, "user"),
      action,
      entity,
      entityId,
      changes,
    });
  } catch (error) {
    console.error("Audit log failed", action, entity, error instanceof Error ? error.name : "error");
  }
}

const HERD_AUDIENCE: Role[] = ["OWNER", "FARM_MANAGER", "FARM_WORKER", "VET", "VIEWER"];

export async function notify(input: {
  ctx: FarmContext;
  type: string;
  title: string;
  body: string;
  href?: string;
  dedupeKey: string;
  audience?: Role[];
  userId?: string;
}): Promise<void> {
  try {
    await Notification.updateOne(
      { farmId: farmOid(input.ctx), dedupeKey: input.dedupeKey },
      {
        $setOnInsert: {
          farmId: farmOid(input.ctx),
          userId: input.userId ? toObjectId(input.userId, "user") : undefined,
          audience: input.audience ?? HERD_AUDIENCE,
          type: input.type,
          title: input.title,
          body: input.body,
          href: input.href,
          dedupeKey: input.dedupeKey,
          readBy: [],
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error("Notification failed", input.type, error instanceof Error ? error.name : "error");
  }
}

export function seesMoney(ctx: FarmContext): boolean {
  return can(ctx.role, "finance:read");
}

export async function reuseOrCreate<T>(lookup: () => Promise<T | null>, create: () => Promise<T>): Promise<T> {
  const existing = await lookup();
  if (existing) return existing;
  try {
    return await create();
  } catch (error) {
    if (duplicateField(error) === "clientTransactionId") {
      const recovered = await lookup();
      if (recovered) return recovered;
    }
    throw error;
  }
}

export async function assertPenCapacity(
  ctx: FarmContext,
  pen: HydratedDocument<PenDoc>,
  incoming: number,
  confirm: boolean,
): Promise<void> {
  if (!pen.capacity || pen.capacity <= 0) return;
  const occupied = await Pig.countDocuments({
    farmId: farmOid(ctx),
    currentPenId: pen._id,
    status: "ACTIVE",
  });
  if (occupied + incoming > pen.capacity && !confirm) {
    throw new AppError(
      "CONFLICT",
      `${pen.code} is at capacity (${occupied}/${pen.capacity}). Confirm if you still want to record the move.`,
      409,
    );
  }
}
