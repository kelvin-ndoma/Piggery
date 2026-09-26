import "server-only";
import { AppError } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { feedLineCost } from "@/lib/rules";
import type { FarmContext } from "@/lib/context";
import { FeedInventory, FeedRecord, FeedType } from "@/models/feed";
import { Pen } from "@/models/farm";
import type { FeedRecordInput } from "@/schemas";
import type { FeedCategory } from "@/types/domain";
import { definedIds } from "@/lib/object-id";
import { actor, assertNotFuture, farmOid, notify, requirePen, reuseOrCreate, today, writeAudit } from "@/services/support";

export async function listFeedTypes(ctx: FarmContext) {
  const types = await FeedType.find({ farmId: farmOid(ctx) }).sort({ name: 1 }).lean();
  const stock = await FeedInventory.find({ farmId: farmOid(ctx) }).lean();
  const quantity = new Map(stock.map((item) => [String(item.feedTypeId), item.quantityKg]));
  return types.map((type) => ({
    id: String(type._id),
    name: type.name,
    category: type.category,
    costPerKg: type.costPerKg,
    reorderLevelKg: type.reorderLevelKg,
    quantityKg: quantity.get(String(type._id)) ?? 0,
    isActive: type.isActive,
    low: (quantity.get(String(type._id)) ?? 0) <= type.reorderLevelKg,
  }));
}

export async function createFeedType(
  ctx: FarmContext,
  input: { name: string; category: FeedCategory; costPerKg: number; reorderLevelKg: number; notes?: string },
) {
  const doc = await FeedType.create({ farmId: farmOid(ctx), ...input });
  await FeedInventory.create({ farmId: farmOid(ctx), feedTypeId: doc._id, quantityKg: 0 });
  await writeAudit(ctx, "feed.type", "FeedType", String(doc._id), { name: doc.name });
  return { id: String(doc._id) };
}

export async function recordFeed(ctx: FarmContext, input: FeedRecordInput) {
  if (input.kind !== "CONSUMPTION" && !can(ctx.role, "finance:write")) {
    throw new AppError("FORBIDDEN", "Purchases and inventory adjustments are limited to the owner and manager.", 403);
  }
  if (input.kind !== "ADJUSTMENT" && input.quantityKg <= 0) {
    throw new AppError("VALIDATION_ERROR", "Enter a quantity greater than zero.", 400);
  }
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Feed date");
  const feedType = await FeedType.findOne({ _id: input.feedTypeId, farmId: farmOid(ctx), isActive: true });
  if (!feedType) throw new AppError("VALIDATION_ERROR", "Choose a feed type from this farm.", 400);
  const pen = input.penId ? await requirePen(ctx, input.penId) : null;
  if (input.kind === "CONSUMPTION" && !pen) {
    throw new AppError("VALIDATION_ERROR", "Record consumption against a pen.", 400);
  }
  const farmId = farmOid(ctx);
  const costPerKg = input.kind === "PURCHASE" ? (input.costPerKg ?? feedType.costPerKg) : feedType.costPerKg;
  const totalCost = feedLineCost(Math.abs(input.quantityKg), costPerKg);
  const delta = input.kind === "CONSUMPTION" ? -Math.abs(input.quantityKg) : input.quantityKg;

  const existing = input.clientTransactionId
    ? await FeedRecord.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean()
    : null;
  if (existing) return { id: String(existing._id), reused: true };

  if (delta < 0) {
    const updated = await FeedInventory.findOneAndUpdate(
      { farmId, feedTypeId: feedType._id, quantityKg: { $gte: Math.abs(delta) } },
      { $inc: { quantityKg: delta } },
      { new: true },
    );
    if (!updated) throw new AppError("VALIDATION_ERROR", "Not enough of that feed is in inventory.", 400);
  } else {
    await FeedInventory.findOneAndUpdate(
      { farmId, feedTypeId: feedType._id },
      { $inc: { quantityKg: delta } },
      { upsert: true, new: true },
    );
  }

  const record = await reuseOrCreate(
    async () =>
      input.clientTransactionId ? FeedRecord.findOne({ farmId, clientTransactionId: input.clientTransactionId }) : null,
    () =>
      FeedRecord.create({
        farmId,
        date: input.date,
        feedTypeId: feedType._id,
        penId: pen?._id,
        kind: input.kind,
        quantityKg: input.quantityKg,
        costPerKg,
        totalCost,
        notes: input.notes,
        clientTransactionId: input.clientTransactionId,
        ...actor(ctx),
      }),
  );

  if (input.kind === "PURCHASE" && input.costPerKg != null) {
    feedType.costPerKg = input.costPerKg;
    await feedType.save();
  }

  const stock = await FeedInventory.findOne({ farmId, feedTypeId: feedType._id }).lean();
  if (stock && stock.quantityKg <= feedType.reorderLevelKg) {
    await notify({
      ctx,
      type: "LOW_STOCK",
      title: `${feedType.name} is low`,
      body: `${stock.quantityKg} kg remaining. Reorder level is ${feedType.reorderLevelKg} kg.`,
      href: "/feed",
      dedupeKey: `low-stock:${String(feedType._id)}:${currentDay}`,
    });
  }
  await writeAudit(ctx, "feed.record", "FeedRecord", String(record._id), { kind: input.kind, quantityKg: input.quantityKg });
  return { id: String(record._id), totalCost: seesCost(ctx) ? totalCost : null, reused: false };
}

function seesCost(ctx: FarmContext) {
  return can(ctx.role, "finance:read");
}

export async function listFeedRecords(ctx: FarmContext, from?: string, to?: string) {
  const filter: Record<string, unknown> = { farmId: farmOid(ctx) };
  if (from || to) filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  const records = await FeedRecord.find(filter).sort({ date: -1 }).limit(200).lean();
  const [types, pens] = await Promise.all([
    FeedType.find({ _id: { $in: records.map((record) => record.feedTypeId) } }).lean(),
    Pen.find({ _id: { $in: definedIds(records.map((record) => record.penId)) } }).lean(),
  ]);
  const typeName = new Map(types.map((type) => [String(type._id), type.name]));
  const penName = new Map(pens.map((pen) => [String(pen._id), pen.code]));
  const showCost = seesCost(ctx);
  return records.map((record) => ({
    id: String(record._id),
    date: record.date,
    feedName: typeName.get(String(record.feedTypeId)) ?? "Feed",
    penCode: record.penId ? (penName.get(String(record.penId)) ?? "Pen") : "—",
    kind: record.kind,
    quantityKg: record.quantityKg,
    costPerKg: showCost ? record.costPerKg : null,
    totalCost: showCost ? record.totalCost : null,
  }));
}

export async function inventorySummary(ctx: FarmContext) {
  const types = await listFeedTypes(ctx);
  return {
    items: types.filter((type) => type.isActive || type.quantityKg > 0),
    low: types.filter((type) => type.isActive && type.low),
    totalKg: types.reduce((sum, type) => sum + type.quantityKg, 0),
  };
}
