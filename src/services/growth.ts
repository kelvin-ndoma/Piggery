import "server-only";
import { daysBetween } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { assertSensibleWeight, averageDailyGain, roundTo } from "@/lib/rules";
import type { FarmContext } from "@/lib/context";
import type { Types } from "mongoose";
import { Pig, PigWeight } from "@/models/pig";
import { Litter } from "@/models/breeding";
import type { WeightInput } from "@/schemas";
import { actor, farmOid, findPig, reuseOrCreate, today, writeAudit } from "@/services/support";

async function refreshStats(farmId: Types.ObjectId, pigId: Types.ObjectId) {
  const weights = await PigWeight.find({ farmId, pigId }).sort({ date: 1 }).lean();
  const first = weights[0];
  const last = weights[weights.length - 1];
  const adg =
    first && last ? averageDailyGain(first.weightKg, last.weightKg, daysBetween(first.date, last.date)) : null;
  await Pig.updateOne(
    { _id: pigId, farmId },
    {
      $set: {
        currentStats: {
          weightKg: last?.weightKg ?? null,
          weighedOn: last?.date ?? null,
          adgKg: adg,
          weightCount: weights.length,
        },
      },
    },
  );
  return { weightKg: last?.weightKg ?? null, adgKg: adg, count: weights.length };
}

export async function recordWeight(ctx: FarmContext, key: string, input: WeightInput) {
  const pig = await findPig(ctx, key);
  const farmId = farmOid(ctx);
  const existing = await PigWeight.find({ farmId, pigId: pig._id }).sort({ date: 1 }).lean();
  if (existing.some((weight) => weight.date === input.date)) {
    const sameTx = input.clientTransactionId
      ? existing.find((weight) => weight.clientTransactionId === input.clientTransactionId)
      : undefined;
    if (sameTx) return { pigId: pig.pigId, weightKg: sameTx.weightKg, date: sameTx.date, reused: true };
    throw new AppError(
      "CONFLICT",
      "A weight is already recorded for this date. Historical weights are not overwritten.",
      409,
    );
  }
  const confirm = Boolean(input.confirmUnusual) && can(ctx.role, "historical:backfill");
  const previous = [...existing].reverse().find((weight) => weight.date < input.date) ?? null;
  const next = existing.find((weight) => weight.date > input.date) ?? null;
  const check = {
    weightKg: input.weightKg,
    date: input.date,
    dateOfBirth: pig.dateOfBirth ?? "",
    today: today(ctx),
    maxWeightKg: ctx.farm.settings.maxWeightKg,
    maxDailyGainKg: ctx.farm.settings.maxDailyGainKg,
    confirmUnusual: confirm,
  };
  assertSensibleWeight({ ...check, neighbor: previous });
  assertSensibleWeight({ ...check, neighbor: next });

  await reuseOrCreate(
    async () =>
      input.clientTransactionId
        ? PigWeight.findOne({ farmId, clientTransactionId: input.clientTransactionId })
        : null,
    () =>
      PigWeight.create({
        farmId,
        pigId: pig._id,
        date: input.date,
        weightKg: input.weightKg,
        notes: input.notes,
        clientTransactionId: input.clientTransactionId,
        ...actor(ctx),
      }),
  );
  const stats = await refreshStats(farmId, pig._id);
  await writeAudit(ctx, "pig.weight", "PigWeight", String(pig._id), { date: input.date, weightKg: input.weightKg });
  return { pigId: pig.pigId, weightKg: input.weightKg, date: input.date, adgKg: stats.adgKg, reused: false };
}

export async function growthSeries(ctx: FarmContext, pigIds: string[]) {
  const farmId = farmOid(ctx);
  const pigs = await Pig.find({ farmId, pigId: { $in: pigIds.map((id) => id.toUpperCase()) } }).lean();
  const weights = await PigWeight.find({ farmId, pigId: { $in: pigs.map((pig) => pig._id) } }).sort({ date: 1 }).lean();
  return pigs.map((pig) => ({
    pigId: pig.pigId,
    points: weights
      .filter((weight) => String(weight.pigId) === String(pig._id))
      .map((weight) => ({ date: weight.date, weightKg: weight.weightKg })),
  }));
}

export async function compareGrowth(
  ctx: FarmContext,
  query: { pigIds?: string; litterId?: string; penId?: string },
) {
  const farmId = farmOid(ctx);
  let pigFilter: Record<string, unknown> = { farmId };
  if (query.litterId) {
    const litter = await Litter.findOne({ _id: query.litterId, farmId }).lean();
    if (!litter) return [];
    pigFilter = { farmId, litterId: litter._id };
  } else if (query.penId) {
    pigFilter = { farmId, currentPenId: query.penId, status: "ACTIVE" };
  } else if (query.pigIds) {
    const codes = query.pigIds.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean).slice(0, 8);
    pigFilter = { farmId, pigId: { $in: codes } };
  } else {
    return [];
  }
  const pigs = await Pig.find(pigFilter).limit(12).lean();
  return growthSeries(
    ctx,
    pigs.map((pig) => pig.pigId),
  );
}

export function summarizeWeights(points: Array<{ date: string; weightKg: number }>) {
  if (points.length === 0) return { gainKg: null as number | null, adgKg: null as number | null };
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || first.date === last.date) return { gainKg: 0, adgKg: null };
  return {
    gainKg: roundTo(last.weightKg - first.weightKg, 2),
    adgKg: averageDailyGain(first.weightKg, last.weightKg, daysBetween(first.date, last.date)),
  };
}
