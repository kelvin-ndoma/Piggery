import "server-only";
import { AppError } from "@/lib/errors";
import { formatLitterNumber, formatPigId } from "@/lib/ids";
import { assertLitterCounts, assertPigIdFormat, assertSensibleWeight, expectedFarrowDate } from "@/lib/rules";
import { definedIds, toObjectId } from "@/lib/object-id";
import type { FarmContext } from "@/lib/context";
import { Breeding, Litter } from "@/models/breeding";
import { Pig, PigBirth, PigWeight } from "@/models/pig";
import type { BreedingInput, LitterInput, PigletInput } from "@/schemas";
import type { BreedingStatus } from "@/types/domain";
import {
  actor,
  assertNotFuture,
  assertPenCapacity,
  farmOid,
  findPig,
  nextSequence,
  notify,
  requirePen,
  reuseOrCreate,
  today,
  writeAudit,
} from "@/services/support";

async function pigCodes(ids: Array<import("mongoose").Types.ObjectId | null | undefined>) {
  const pigs = await Pig.find({ _id: { $in: definedIds(ids) } }).select("pigId").lean();
  return new Map(pigs.map((pig) => [String(pig._id), pig.pigId]));
}

export async function listBreeding(ctx: FarmContext) {
  const records = await Breeding.find({ farmId: farmOid(ctx) }).sort({ breedingDate: -1 }).limit(100).lean();
  const codes = await pigCodes(records.flatMap((record) => [record.sowId, record.boarId]));
  return records.map((record) => ({
    id: String(record._id),
    sow: codes.get(String(record.sowId)) ?? "Sow",
    sowRef: String(record.sowId),
    boar: record.boarId ? (codes.get(String(record.boarId)) ?? "Boar") : "—",
    breedingDate: record.breedingDate,
    method: record.method,
    status: record.status,
    expectedFarrowDate: record.expectedFarrowDate,
    actualFarrowDate: record.actualFarrowDate ?? null,
  }));
}

export async function recordBreeding(ctx: FarmContext, input: BreedingInput) {
  const sow = await findPig(ctx, input.sowId);
  if (sow.sex !== "FEMALE" || sow.status !== "ACTIVE") {
    throw new AppError("VALIDATION_ERROR", "Choose an active female pig as the sow.", 400);
  }
  const boar = input.boarId ? await findPig(ctx, input.boarId) : null;
  if (boar && (boar.sex !== "MALE" || boar.status !== "ACTIVE")) {
    throw new AppError("VALIDATION_ERROR", "Choose an active male pig as the boar.", 400);
  }
  if (boar && String(boar._id) === String(sow._id)) {
    throw new AppError("VALIDATION_ERROR", "The sow and boar must be different pigs.", 400);
  }
  const currentDay = today(ctx);
  assertNotFuture(input.breedingDate, currentDay, "Serving date");
  if (sow.dateOfBirth && input.breedingDate < sow.dateOfBirth) {
    throw new AppError("VALIDATION_ERROR", "The serving date cannot be before the sow's date of birth.", 400);
  }
  const expected = expectedFarrowDate(input.breedingDate, ctx.farm.settings.gestationDays);
  const farmId = farmOid(ctx);
  const record = await reuseOrCreate(
    async () =>
      input.clientTransactionId
        ? Breeding.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean()
        : null,
    () =>
      Breeding.create({
        farmId,
        sowId: sow._id,
        boarId: boar?._id,
        breedingDate: input.breedingDate,
        method: input.method,
        status: "PENDING",
        expectedFarrowDate: expected,
        notes: input.notes,
        statusHistory: [{ status: "PENDING", at: input.breedingDate, userId: toObjectId(ctx.userId) }],
        clientTransactionId: input.clientTransactionId,
        ...actor(ctx),
      }),
  );
  await writeAudit(ctx, "breeding.create", "Breeding", String(record._id), { sow: sow.pigId, date: input.breedingDate });
  await notify({
    ctx,
    type: "FARROWING",
    title: `Expected farrowing ${expected}`,
    body: `${sow.pigId} was served on ${input.breedingDate}. Due to farrow uses the farm gestation length of ${ctx.farm.settings.gestationDays} days.`,
    href: "/serving",
    dedupeKey: `farrow:${String(record._id)}`,
  });
  return { id: String(record._id), expectedFarrowDate: expected };
}

const NEXT_STATUS: Partial<Record<BreedingStatus, BreedingStatus[]>> = {
  PENDING: ["CONFIRMED_PREGNANT", "NOT_PREGNANT", "FAILED"],
  CONFIRMED_PREGNANT: ["FAILED"],
};

export async function updateBreedingStatus(
  ctx: FarmContext,
  id: string,
  input: { status: "CONFIRMED_PREGNANT" | "NOT_PREGNANT" | "FAILED"; date?: string; note?: string },
) {
  const record = await Breeding.findOne({ _id: id, farmId: farmOid(ctx) });
  if (!record) throw new AppError("NOT_FOUND", "That serving record was not found.", 404);
  const allowed = NEXT_STATUS[record.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw new AppError("VALIDATION_ERROR", "That serving status cannot be changed in this way.", 400);
  }
  const date = input.date ?? today(ctx);
  assertNotFuture(date, today(ctx), "Confirmation date");
  if (date < record.breedingDate) {
    throw new AppError("VALIDATION_ERROR", "The confirmation date cannot be before the serving date.", 400);
  }
  record.statusHistory.push({ status: input.status, at: date, userId: toObjectId(ctx.userId), note: input.note });
  record.status = input.status;
  if (input.status === "CONFIRMED_PREGNANT") record.pregnancyConfirmedOn = date;
  await record.save();
  await writeAudit(ctx, "breeding.status", "Breeding", String(record._id), { status: input.status });
  return { id: String(record._id), status: record.status };
}

export async function listLitters(ctx: FarmContext) {
  const litters = await Litter.find({ farmId: farmOid(ctx) }).sort({ birthDate: -1 }).limit(100).lean();
  const codes = await pigCodes(litters.flatMap((litter) => [litter.motherId, litter.fatherId]));
  return litters.map((litter) => ({
    id: String(litter._id),
    litterNumber: litter.litterNumber,
    mother: codes.get(String(litter.motherId)) ?? "Sow",
    father: litter.fatherId ? (codes.get(String(litter.fatherId)) ?? "Boar") : "—",
    birthDate: litter.birthDate,
    bornAlive: litter.bornAlive,
    stillborn: litter.stillborn,
    male: litter.male,
    female: litter.female,
    currentlyAlive: litter.currentlyAlive,
  }));
}

export async function recordLitter(ctx: FarmContext, input: LitterInput) {
  assertLitterCounts(input);
  const mother = await findPig(ctx, input.motherId);
  if (mother.sex !== "FEMALE") throw new AppError("VALIDATION_ERROR", "The mother must be a female pig.", 400);
  const father = input.fatherId ? await findPig(ctx, input.fatherId) : null;
  if (father && father.sex !== "MALE") throw new AppError("VALIDATION_ERROR", "The father must be a male pig.", 400);
  const currentDay = today(ctx);
  assertNotFuture(input.birthDate, currentDay, "Birth date");
  if (mother.dateOfBirth && input.birthDate < mother.dateOfBirth) {
    throw new AppError("VALIDATION_ERROR", "The birth date cannot be before the mother's date of birth.", 400);
  }
  const farmId = farmOid(ctx);
  let breeding = null;
  if (input.breedingId) {
    breeding = await Breeding.findOne({ _id: input.breedingId, farmId, sowId: mother._id });
    if (!breeding) throw new AppError("VALIDATION_ERROR", "That serving record does not match this sow.", 400);
    if (breeding.status === "FARROWED") throw new AppError("CONFLICT", "That serving has already been farrowed.", 409);
  }
  const litter = await reuseOrCreate(
    async () =>
      input.clientTransactionId ? Litter.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean() : null,
    async () => {
      const year = Number(input.birthDate.slice(0, 4));
      const litterNumber = formatLitterNumber(year, await nextSequence(farmId, `litter:${year}`));
      return Litter.create({
        farmId,
        litterNumber,
        motherId: mother._id,
        fatherId: father?._id ?? breeding?.boarId,
        breedingId: breeding?._id,
        birthDate: input.birthDate,
        bornAlive: input.bornAlive,
        stillborn: input.stillborn,
        male: input.male,
        female: input.female,
        currentlyAlive: input.bornAlive,
        notes: input.notes,
        clientTransactionId: input.clientTransactionId,
      });
    },
  );
  if (breeding) {
    breeding.status = "FARROWED";
    breeding.actualFarrowDate = input.birthDate;
    breeding.statusHistory.push({ status: "FARROWED", at: input.birthDate, userId: toObjectId(ctx.userId) });
    await breeding.save();
  }
  await writeAudit(ctx, "litter.create", "Litter", String(litter._id), { litterNumber: litter.litterNumber });
  return { id: String(litter._id), litterNumber: litter.litterNumber };
}

export async function getLitter(ctx: FarmContext, id: string) {
  const litter = await Litter.findOne({ _id: id, farmId: farmOid(ctx) }).lean();
  if (!litter) throw new AppError("NOT_FOUND", "That litter was not found.", 404);
  const [births, codes] = await Promise.all([
    PigBirth.find({ farmId: farmOid(ctx), litterId: litter._id }).lean(),
    pigCodes([litter.motherId, litter.fatherId]),
  ]);
  const pigs = await Pig.find({ _id: { $in: births.map((birth) => birth.pigId) } }).lean();
  const pigById = new Map(pigs.map((pig) => [String(pig._id), pig]));
  return {
    id: String(litter._id),
    litterNumber: litter.litterNumber,
    mother: codes.get(String(litter.motherId)) ?? "Sow",
    father: litter.fatherId ? (codes.get(String(litter.fatherId)) ?? "Boar") : "—",
    birthDate: litter.birthDate,
    bornAlive: litter.bornAlive,
    stillborn: litter.stillborn,
    male: litter.male,
    female: litter.female,
    currentlyAlive: litter.currentlyAlive,
    notes: litter.notes ?? "",
    piglets: births.map((birth) => {
      const pig = pigById.get(String(birth.pigId));
      return {
        id: String(birth.pigId),
        pigId: pig?.pigId ?? "Pig",
        sex: birth.sex,
        status: pig?.status ?? "ACTIVE",
        birthWeightKg: birth.birthWeightKg ?? null,
      };
    }),
  };
}

export async function registerPiglets(ctx: FarmContext, litterId: string, input: PigletInput) {
  const farmId = farmOid(ctx);
  const litter = await Litter.findOne({ _id: litterId, farmId });
  if (!litter) throw new AppError("NOT_FOUND", "That litter was not found.", 404);
  const existing = await PigBirth.find({ farmId, litterId: litter._id }).lean();
  const existingTx = input.clientTransactionId
    ? await Pig.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean()
    : null;
  if (existingTx) return { litterNumber: litter.litterNumber, created: 0, reused: true };

  const males = existing.filter((birth) => birth.sex === "MALE").length + input.piglets.filter((piglet) => piglet.sex === "MALE").length;
  const females = existing.filter((birth) => birth.sex === "FEMALE").length + input.piglets.filter((piglet) => piglet.sex === "FEMALE").length;
  if (males > litter.male || females > litter.female) {
    throw new AppError(
      "VALIDATION_ERROR",
      `This litter was recorded as ${litter.male} male and ${litter.female} female. Update those counts before registering more piglets.`,
      400,
    );
  }
  const pen = input.penId ? await requirePen(ctx, input.penId) : null;
  if (pen) await assertPenCapacity(ctx, pen, input.piglets.length, false);
  const currentDay = today(ctx);
  const motherBreed = (await Pig.findById(litter.motherId).select("breed").lean())?.breed ?? "Unknown";
  const created: string[] = [];
  for (const piglet of input.piglets) {
    const pigId = formatPigId(await nextSequence(farmId, "pig"));
    assertPigIdFormat(pigId);
    const pig = await Pig.create({
      farmId,
      pigId,
      qrCode: pigId,
      earTag: piglet.earTag,
      sex: piglet.sex,
      breed: motherBreed,
      dateOfBirth: litter.birthDate,
      source: "BORN_ON_FARM",
      motherId: litter.motherId,
      fatherId: litter.fatherId,
      litterId: litter._id,
      currentPenId: pen?._id,
      category: "PIGLET",
      status: "ACTIVE",
      currentStats: { weightKg: null, weighedOn: null, adgKg: null, weightCount: 0 },
      clientTransactionId: input.clientTransactionId && created.length === 0 ? input.clientTransactionId : undefined,
    });
    await PigBirth.create({
      farmId,
      litterId: litter._id,
      pigId: pig._id,
      sex: piglet.sex,
      birthWeightKg: piglet.weightKg ?? undefined,
    });
    if (piglet.weightKg) {
      assertSensibleWeight({
        weightKg: piglet.weightKg,
        date: litter.birthDate,
        dateOfBirth: litter.birthDate,
        today: currentDay,
        neighbor: null,
        maxWeightKg: ctx.farm.settings.maxWeightKg,
        maxDailyGainKg: ctx.farm.settings.maxDailyGainKg,
        confirmUnusual: false,
      });
      await PigWeight.create({
        farmId,
        pigId: pig._id,
        date: litter.birthDate,
        weightKg: piglet.weightKg,
        notes: "Birth weight",
        ...actor(ctx),
      });
      pig.currentStats = { weightKg: piglet.weightKg, weighedOn: litter.birthDate, adgKg: null, weightCount: 1 };
      await pig.save();
    }
    created.push(pig.pigId);
  }
  litter.currentlyAlive = await Pig.countDocuments({ farmId, litterId: litter._id, status: "ACTIVE" });
  await litter.save();
  await writeAudit(ctx, "piglet.create", "Litter", String(litter._id), { piglets: created });
  return { litterNumber: litter.litterNumber, created: created.length, pigIds: created, reused: false };
}
