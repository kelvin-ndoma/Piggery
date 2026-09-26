import "server-only";
import { AppError } from "@/lib/errors";
import type { FarmContext } from "@/lib/context";
import { Building, Pen } from "@/models/farm";
import { Pig } from "@/models/pig";
import type { PenType } from "@/types/domain";
import { farmOid, writeAudit } from "@/services/support";

export async function listHousing(ctx: FarmContext) {
  const farmId = farmOid(ctx);
  const [buildings, pens, counts] = await Promise.all([
    Building.find({ farmId }).sort({ code: 1 }).lean(),
    Pen.find({ farmId }).sort({ code: 1 }).lean(),
    Pig.aggregate<{ _id: unknown; count: number }>([
      { $match: { farmId, status: "ACTIVE", currentPenId: { $ne: null } } },
      { $group: { _id: "$currentPenId", count: { $sum: 1 } } },
    ]),
  ]);
  const occupancy = new Map(counts.map((row) => [String(row._id), row.count]));
  return buildings.map((building) => ({
    id: String(building._id),
    name: building.name,
    code: building.code,
    notes: building.notes ?? "",
    isActive: building.isActive,
    pens: pens
      .filter((pen) => String(pen.buildingId) === String(building._id))
      .map((pen) => ({
        id: String(pen._id),
        name: pen.name,
        code: pen.code,
        type: pen.type,
        capacity: pen.capacity ?? null,
        occupied: occupancy.get(String(pen._id)) ?? 0,
        isActive: pen.isActive,
        notes: pen.notes ?? "",
      })),
  }));
}

export async function createBuilding(ctx: FarmContext, input: { name: string; code: string; notes?: string }) {
  const building = await Building.create({
    farmId: farmOid(ctx),
    name: input.name,
    code: input.code.toUpperCase(),
    notes: input.notes,
  });
  await writeAudit(ctx, "building.create", "Building", String(building._id), { code: building.code });
  return { id: String(building._id) };
}

export async function createPen(
  ctx: FarmContext,
  input: { buildingId: string; name: string; code: string; type: PenType; capacity?: number | null; notes?: string },
) {
  const building = await Building.findOne({ _id: input.buildingId, farmId: farmOid(ctx), isActive: true });
  if (!building) throw new AppError("VALIDATION_ERROR", "Choose a building on this farm.", 400);
  const pen = await Pen.create({
    farmId: farmOid(ctx),
    buildingId: building._id,
    name: input.name,
    code: input.code.toUpperCase(),
    type: input.type,
    capacity: input.capacity ?? undefined,
    notes: input.notes,
  });
  await writeAudit(ctx, "pen.create", "Pen", String(pen._id), { code: pen.code });
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
