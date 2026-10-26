import "server-only";
import { formatAge } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { definedIds, toObjectId } from "@/lib/object-id";
import type { FarmContext } from "@/lib/context";
import { Building, Pen } from "@/models/farm";
import { Pig } from "@/models/pig";
import type { PenType } from "@/types/domain";
import { farmOid, today, writeAudit } from "@/services/support";

export async function listHousing(ctx: FarmContext) {
  const farmId = farmOid(ctx);
  const currentDay = today(ctx);
  const [buildings, pens, residents] = await Promise.all([
    Building.find({ farmId }).sort({ code: 1 }).lean(),
    Pen.find({ farmId }).sort({ code: 1 }).lean(),
    Pig.find({ farmId, status: "ACTIVE", currentPenId: { $ne: null } })
      .select("currentPenId dateOfBirth motherId")
      .lean(),
  ]);
  const motherIds = definedIds([
    ...residents.map((pig) => pig.motherId),
    ...pens.map((pen) => pen.motherId),
  ]);
  const mothers = motherIds.length
    ? await Pig.find({ farmId, _id: { $in: motherIds } }).select("pigId").lean()
    : [];
  const motherCode = new Map(mothers.map((pig) => [String(pig._id), pig.pigId]));
  const byPen = new Map<string, typeof residents>();
  for (const pig of residents) {
    const key = String(pig.currentPenId);
    const list = byPen.get(key) ?? [];
    list.push(pig);
    byPen.set(key, list);
  }

  return buildings.map((building) => ({
    id: String(building._id),
    name: building.name,
    code: building.code,
    notes: building.notes ?? "",
    isActive: building.isActive,
    pens: pens
      .filter((pen) => String(pen.buildingId) === String(building._id))
      .sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true }))
      .map((pen) => {
        const pigs = byPen.get(String(pen._id)) ?? [];
        const ages = [
          ...new Set(
            pigs
              .map((pig) => (pig.dateOfBirth ? formatAge(pig.dateOfBirth, currentDay) : null))
              .filter((value): value is string => Boolean(value)),
          ),
        ];
        const pigMothers = [
          ...new Set(
            pigs
              .map((pig) => (pig.motherId ? motherCode.get(String(pig.motherId)) : null))
              .filter((value): value is string => Boolean(value)),
          ),
        ];
        const ageLabel =
          ages.length === 1
            ? ages[0]
            : ages.length > 1
              ? ages.slice(0, 3).join(" · ")
              : pen.groupBornOn
                ? formatAge(pen.groupBornOn, currentDay)
                : pen.groupAgeNote || null;
        const motherLabel =
          pigMothers.length === 1
            ? pigMothers[0]
            : pigMothers.length > 1
              ? pigMothers.join(", ")
              : pen.motherId
                ? motherCode.get(String(pen.motherId)) ?? null
                : null;
        return {
          id: String(pen._id),
          name: pen.name,
          code: pen.code,
          type: pen.type,
          capacity: pen.capacity ?? null,
          occupied: pigs.length,
          plannedFeedKgPerDay: pen.plannedFeedKgPerDay ?? null,
          isActive: pen.isActive,
          notes: pen.notes ?? "",
          groupBornOn: pen.groupBornOn ?? "",
          motherId: pen.motherId ? String(pen.motherId) : "",
          ageLabel,
          motherLabel,
        };
      }),
  }));
}

function codeFromName(name: string): string {
  const compact = name.replace(/[^a-z0-9]+/gi, "").slice(0, 20).toUpperCase();
  return compact || "BLOCK";
}

export async function createBuilding(ctx: FarmContext, input: { name: string; code?: string; notes?: string }) {
  const farmId = farmOid(ctx);
  const name = input.name.trim();
  const existing = await Building.findOne({
    farmId,
    name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });
  if (existing) {
    throw new AppError("CONFLICT", `Block ${existing.name} is already on this farm.`, 409);
  }
  let code = (input.code?.trim() || codeFromName(name)).toUpperCase();
  if (await Building.exists({ farmId, code })) {
    let n = 2;
    while (await Building.exists({ farmId, code: `${code.slice(0, 18)}${n}` })) n += 1;
    code = `${code.slice(0, 18)}${n}`;
  }
  const building = await Building.create({
    farmId,
    name,
    code,
    notes: input.notes,
  });
  await writeAudit(ctx, "building.create", "Building", String(building._id), { code: building.code });
  return { id: String(building._id) };
}

export async function createPen(
  ctx: FarmContext,
  input: {
    block?: string;
    buildingId?: string;
    name?: string;
    code: string;
    type?: PenType;
    capacity?: number | null;
    notes?: string;
    groupBornOn?: string;
    groupAgeNote?: string;
    motherId?: string;
  },
) {
  const farmId = farmOid(ctx);
  try {
    await Pen.collection.dropIndex("farmId_1_code_1");
  } catch {
    // farm-wide code unique index is replaced by block + number
  }

  let building = input.buildingId
    ? await Building.findOne({ _id: input.buildingId, farmId, isActive: true })
    : null;
  const blockName = input.block?.trim();
  if (!building && blockName) {
    building = await Building.findOne({
      farmId,
      name: new RegExp(`^${blockName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (!building) {
      const created = await createBuilding(ctx, { name: blockName });
      building = await Building.findOne({ _id: created.id, farmId });
    }
  }
  if (!building) throw new AppError("VALIDATION_ERROR", "Enter the block.", 400);

  const code = input.code.trim().toUpperCase();
  const label = `${building.name}-${code}`;
  const pen = await Pen.create({
    farmId,
    buildingId: building._id,
    name: input.name?.trim() || label,
    code,
    type: input.type ?? "MIXED",
    capacity: input.capacity ?? undefined,
    notes: input.notes,
    groupBornOn: input.groupBornOn,
    groupAgeNote: input.groupAgeNote,
    motherId: input.motherId ? toObjectId(input.motherId, "mother") : undefined,
  });
  await writeAudit(ctx, "pen.create", "Pen", String(pen._id), { code: pen.code, block: building.name });
  return { id: String(pen._id), label };
}

export async function updatePen(
  ctx: FarmContext,
  id: string,
  input: {
    type?: PenType;
    capacity?: number | null;
    notes?: string;
    groupBornOn?: string | null;
    groupAgeNote?: string;
    motherId?: string | null;
  },
) {
  const pen = await Pen.findOne({ _id: id, farmId: farmOid(ctx) });
  if (!pen) throw new AppError("NOT_FOUND", "That pen was not found.", 404);
  if (input.type) pen.type = input.type;
  if (input.capacity !== undefined) pen.capacity = input.capacity;
  if (input.notes !== undefined) pen.notes = input.notes;
  if (input.groupBornOn !== undefined) pen.groupBornOn = input.groupBornOn;
  if (input.groupAgeNote !== undefined) pen.groupAgeNote = input.groupAgeNote;
  if (input.motherId !== undefined) pen.motherId = input.motherId ? toObjectId(input.motherId, "mother") : null;
  await pen.save();
  await writeAudit(ctx, "pen.update", "Pen", String(pen._id), { code: pen.code });
  return { id: String(pen._id) };
}

export async function setBuildingActive(ctx: FarmContext, id: string, isActive: boolean) {
  const building = await Building.findOne({ _id: id, farmId: farmOid(ctx) });
  if (!building) throw new AppError("NOT_FOUND", "That building was not found.", 404);
  if (!isActive) {
    const occupied = await Pig.countDocuments({
      farmId: farmOid(ctx),
      status: "ACTIVE",
      currentPenId: { $in: await Pen.find({ buildingId: building._id }).distinct("_id") },
    });
    if (occupied > 0) throw new AppError("CONFLICT", "Move the pigs out before closing this building.", 409);
  }
  building.isActive = isActive;
  await building.save();
  return { id: String(building._id), isActive };
}

export async function setPenActive(ctx: FarmContext, id: string, isActive: boolean) {
  const pen = await Pen.findOne({ _id: id, farmId: farmOid(ctx) });
  if (!pen) throw new AppError("NOT_FOUND", "That pen was not found.", 404);
  if (!isActive) {
    const occupied = await Pig.countDocuments({ farmId: farmOid(ctx), currentPenId: pen._id, status: "ACTIVE" });
    if (occupied > 0) throw new AppError("CONFLICT", "Move the pigs out before closing this pen.", 409);
  }
  pen.isActive = isActive;
  await pen.save();
  return { id: String(pen._id), isActive };
}
