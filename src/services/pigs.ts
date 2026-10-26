import "server-only";
import { formatAge } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { formatPigId } from "@/lib/ids";
import { can } from "@/lib/permissions";
import { assertCanMove, assertPigIdFormat } from "@/lib/rules";
import { definedIds, toObjectId } from "@/lib/object-id";
import { escapeRegex, penPurpose } from "@/lib/utils";
import type { FarmContext } from "@/lib/context";
import { Building, Pen } from "@/models/farm";
import { Pig, PigBirth, PigMovement, PigWeight } from "@/models/pig";
import { Breeding, Litter } from "@/models/breeding";
import { HealthIncident, Mortality, Treatment, Vaccination, Vaccine } from "@/models/health";
import { FeedRecord, FeedType } from "@/models/feed";
import { Sale } from "@/models/operations";
import type { CreatePigInput, UpdatePigInput } from "@/schemas";
import type { PigCategory, PigSex, PigSource, PigStatus } from "@/types/domain";
import {
  actor,
  assertNotFuture,
  assertPenCapacity,
  farmOid,
  findPig,
  nextSequence,
  requirePen,
  reuseOrCreate,
  seesMoney,
  today,
  writeAudit,
} from "@/services/support";

export type PigListItem = {
  id: string;
  pigId: string;
  earTag: string | null;
  sex: PigSex;
  breed: string;
  dateOfBirth: string | null;
  ageLabel: string;
  source: PigSource;
  category: PigCategory;
  status: PigStatus;
  penId: string | null;
  penLabel: string | null;
  motherLabel: string | null;
  weightKg: number | null;
  adgKg: number | null;
};

function formatPenLabel(pen: { code: string; name?: string }, block?: string | null) {
  if (block) return `${block}-${pen.code}`;
  return pen.name?.includes("-") ? pen.name : `Pen ${pen.code}`;
}

async function penMap(ctx: FarmContext, ids: ReadonlyArray<import("mongoose").Types.ObjectId | string | null | undefined>) {
  const pens = await Pen.find({ farmId: farmOid(ctx), _id: { $in: definedIds(ids) } }).lean();
  const buildings = await Building.find({ _id: { $in: pens.map((pen) => pen.buildingId) } }).lean();
  const blocks = new Map(buildings.map((building) => [String(building._id), building.name]));
  return new Map(
    pens.map((pen) => [
      String(pen._id),
      { ...pen, block: blocks.get(String(pen.buildingId)) ?? "", label: formatPenLabel(pen, blocks.get(String(pen.buildingId))) },
    ]),
  );
}

function toListItem(
  pig: {
    _id: unknown;
    pigId: string;
    earTag?: string | null;
    sex: PigSex;
    breed: string;
    dateOfBirth?: string | null;
    source: PigSource;
    category: PigCategory;
    status: PigStatus;
    currentPenId?: unknown;
    motherId?: unknown;
    currentStats?: { weightKg?: number | null; adgKg?: number | null };
  },
  pens: Map<string, { code: string; name: string; label?: string }>,
  currentDay: string,
  mothers: Map<string, string> = new Map(),
): PigListItem {
  const pen = pig.currentPenId ? pens.get(String(pig.currentPenId)) : undefined;
  return {
    id: String(pig._id),
    pigId: pig.pigId,
    earTag: pig.earTag || null,
    sex: pig.sex,
    breed: pig.breed,
    dateOfBirth: pig.dateOfBirth ?? null,
    ageLabel: formatAge(pig.dateOfBirth, currentDay),
    source: pig.source,
    category: pig.category,
    status: pig.status,
    penId: pig.currentPenId ? String(pig.currentPenId) : null,
    penLabel: pen?.label ?? (pen ? formatPenLabel(pen) : null),
    motherLabel: pig.motherId ? mothers.get(String(pig.motherId)) ?? null : null,
    weightKg: pig.currentStats?.weightKg ?? null,
    adgKg: pig.currentStats?.adgKg ?? null,
  };
}

export async function listPigs(
  ctx: FarmContext,
  query: { q?: string; status?: string; category?: string; sex?: string; penId?: string; page?: number },
) {
  const farmId = farmOid(ctx);
  const filter: Record<string, unknown> = { farmId };
  if (query.status && query.status !== "ALL" && query.status !== "") filter.status = query.status;
  else if (!query.status) filter.status = "ACTIVE";
  if (query.category && query.category !== "ALL" && query.category !== "") filter.category = query.category;
  if (query.sex && query.sex !== "ALL" && query.sex !== "") filter.sex = query.sex;
  if (query.penId) filter.currentPenId = toObjectId(query.penId, "pen");
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q.trim()), "i");
    filter.$or = [{ pigId: pattern }, { earTag: pattern }, { breed: pattern }];
  }
  const page = query.page ?? 1;
  const limit = 100;
  const [pigs, total] = await Promise.all([
    Pig.find(filter)
      .sort({ status: 1, pigId: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Pig.countDocuments(filter),
  ]);
  const pens = await penMap(
    ctx,
    pigs.map((pig) => pig.currentPenId),
  );
  const motherDocs = await Pig.find({ farmId, _id: { $in: definedIds(pigs.map((pig) => pig.motherId)) } })
    .select("pigId")
    .lean();
  const mothers = new Map(motherDocs.map((pig) => [String(pig._id), pig.pigId]));
  const currentDay = today(ctx);
  return {
    pigs: pigs.map((pig) => toListItem(pig, pens, currentDay, mothers)),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function pigOptions(ctx: FarmContext, filter: { status?: PigStatus; sex?: PigSex } = {}) {
  const pigs = await Pig.find({ farmId: farmOid(ctx), ...filter })
    .sort({ pigId: 1 })
    .limit(500)
    .lean();
  return pigs.map((pig) => ({
    value: String(pig._id),
    label: pig.earTag ? `${pig.pigId} · ${pig.earTag}` : pig.pigId,
    keywords: `${pig.pigId} ${pig.earTag ?? ""} ${pig.breed} ${pig.category}`,
    description: `${pig.sex === "FEMALE" ? "Female" : pig.sex === "MALE" ? "Male" : "Sex not recorded"} · ${pig.category} · ${pig.status}`,
  }));
}

async function assertRelative(ctx: FarmContext, id: string | undefined, sex: PigSex, label: string, selfId?: string) {
  if (!id) return undefined;
  const relative = await findPig(ctx, id);
  if (selfId && String(relative._id) === selfId) {
    throw new AppError("VALIDATION_ERROR", `A pig cannot be its own ${label}.`, 400);
  }
  if (relative.sex !== sex) {
    throw new AppError("VALIDATION_ERROR", `The ${label} must be ${sex === "FEMALE" ? "female" : "male"}.`, 400);
  }
  return relative._id;
}

export async function createPig(ctx: FarmContext, input: CreatePigInput) {
  const farmId = farmOid(ctx);
  const currentDay = today(ctx);
  if (input.dateOfBirth) assertNotFuture(input.dateOfBirth, currentDay, "Date of birth");
  const motherId = await assertRelative(ctx, input.motherId, "FEMALE", "mother");
  const fatherId = await assertRelative(ctx, input.fatherId, "MALE", "father");
  if (motherId && fatherId && motherId.equals(fatherId)) {
    throw new AppError("VALIDATION_ERROR", "The mother and father must be different pigs.", 400);
  }
  if (!input.earTag?.trim()) {
    throw new AppError("VALIDATION_ERROR", "Enter an ear tag.", 400);
  }
  const pen = await requirePen(ctx, input.currentPenId);
  await assertPenCapacity(ctx, pen, 1, Boolean(input.confirmOverCapacity));

  const pigId = input.pigId?.trim().toUpperCase();
  if (pigId) assertPigIdFormat(pigId);

  const created = await reuseOrCreate(
    async () =>
      input.clientTransactionId
        ? Pig.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean()
        : null,
    async () => {
      const allocated = pigId ?? formatPigId(await nextSequence(farmId, "pig"));
      if (!pigId) assertPigIdFormat(allocated);
      const acquisition = {
        date: input.acquisitionDate,
        supplier: input.acquisitionSupplier,
        notes: undefined as string | undefined,
        price: can(ctx.role, "finance:write") ? (input.acquisitionPrice ?? undefined) : undefined,
      };
      const doc = await Pig.create({
        farmId,
        pigId: allocated,
        earTag: input.earTag.trim(),
        qrCode: allocated,
        sex: input.sex,
        breed: input.breed,
        dateOfBirth: input.dateOfBirth,
        source: input.source,
        motherId,
        fatherId,
        currentPenId: pen._id,
        category: input.category,
        status: "ACTIVE",
        acquisition: acquisition.date || acquisition.supplier || acquisition.price ? acquisition : undefined,
        currentStats: { weightKg: null, weighedOn: null, adgKg: null, weightCount: 0 },
        notes: input.notes,
        clientTransactionId: input.clientTransactionId,
      });
      await PigMovement.create({
        farmId,
        pigId: doc._id,
        toPenId: pen._id,
        date: currentDay,
        reason: "OTHER",
        notes: "Placed on registration",
        ...actor(ctx),
      });
      await writeAudit(ctx, "pig.create", "Pig", String(doc._id), { pigId: doc.pigId, category: doc.category });
      return doc.toObject();
    },
  );

  const pens = await penMap(ctx, [created.currentPenId]);
  return toListItem(created, pens, currentDay);
}

export async function updatePig(ctx: FarmContext, key: string, input: UpdatePigInput) {
  const pig = await findPig(ctx, key);
  const currentDay = today(ctx);
  if (input.dateOfBirth) assertNotFuture(input.dateOfBirth, currentDay, "Date of birth");
  const before = { earTag: pig.earTag, category: pig.category, status: pig.status, breed: pig.breed };
  if (input.earTag !== undefined) pig.earTag = input.earTag || undefined;
  if (input.breed) pig.breed = input.breed;
  if (input.dateOfBirth !== undefined) pig.dateOfBirth = input.dateOfBirth;
  if (input.category) pig.category = input.category;
  if (input.sex) pig.sex = input.sex;
  if (input.notes !== undefined) pig.notes = input.notes || undefined;
  if (input.source) pig.source = input.source;
  if (input.motherId !== undefined) pig.motherId = await assertRelative(ctx, input.motherId, "FEMALE", "mother", String(pig._id));
  if (input.fatherId !== undefined) pig.fatherId = await assertRelative(ctx, input.fatherId, "MALE", "father", String(pig._id));
  if (can(ctx.role, "finance:write") && (input.acquisitionDate || input.acquisitionSupplier || input.acquisitionPrice != null)) {
    pig.acquisition = {
      date: input.acquisitionDate ?? pig.acquisition?.date,
      supplier: input.acquisitionSupplier ?? pig.acquisition?.supplier,
      price: input.acquisitionPrice ?? pig.acquisition?.price,
      notes: pig.acquisition?.notes,
    };
  }
  pig.status = before.status;
  await pig.save();
  await writeAudit(ctx, "pig.update", "Pig", String(pig._id), { before, after: { earTag: pig.earTag, category: pig.category, breed: pig.breed } });
  const pens = await penMap(ctx, [pig.currentPenId]);
  return toListItem(pig.toObject(), pens, currentDay);
}

export async function recordMovement(
  ctx: FarmContext,
  key: string,
  input: { date: string; toPenId: string; reason: PigMovementReason; notes?: string; confirmOverCapacity?: boolean; clientTransactionId?: string },
) {
  const pig = await findPig(ctx, key);
  assertCanMove(pig.status);
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Movement date");
  if (pig.dateOfBirth && input.date < pig.dateOfBirth) {
    throw new AppError("VALIDATION_ERROR", "The movement date cannot be before the pig's date of birth.", 400);
  }
  const pen = await requirePen(ctx, input.toPenId);
  if (pig.currentPenId && String(pig.currentPenId) === String(pen._id)) {
    throw new AppError("VALIDATION_ERROR", "The pig is already in that pen.", 400);
  }
  await assertPenCapacity(ctx, pen, 1, Boolean(input.confirmOverCapacity));
  const farmId = farmOid(ctx);
  const fromPenId = pig.currentPenId;
  await reuseOrCreate(
    async () =>
      input.clientTransactionId
        ? PigMovement.findOne({ farmId, clientTransactionId: input.clientTransactionId })
        : null,
    () =>
      PigMovement.create({
        farmId,
        pigId: pig._id,
        fromPenId,
        toPenId: pen._id,
        date: input.date,
        reason: input.reason,
        notes: input.notes,
        clientTransactionId: input.clientTransactionId,
        ...actor(ctx),
      }),
  );
  pig.currentPenId = pen._id;
  await pig.save();
  await writeAudit(ctx, "pig.move", "Pig", String(pig._id), { toPen: pen.code, date: input.date });
  return { pigId: pig.pigId, penLabel: formatPenLabel(pen) };
}

type PigMovementReason = import("@/types/domain").MovementReason;

export async function recordExit(
  ctx: FarmContext,
  key: string,
  input: { date: string; type: "TRANSFERRED" | "CULLED"; notes?: string; clientTransactionId?: string },
) {
  const pig = await findPig(ctx, key);
  if (pig.status !== "ACTIVE") {
    throw new AppError("VALIDATION_ERROR", "Only an active pig can be transferred or culled.", 400);
  }
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Date");
  const farmId = farmOid(ctx);
  await reuseOrCreate(
    async () =>
      input.clientTransactionId
        ? PigMovement.findOne({ farmId, clientTransactionId: input.clientTransactionId })
        : null,
    () =>
      PigMovement.create({
        farmId,
        pigId: pig._id,
        fromPenId: pig.currentPenId,
        date: input.date,
        reason: input.type === "TRANSFERRED" ? "OFF_FARM" : "OTHER",
        notes: input.notes ?? (input.type === "CULLED" ? "Culled" : "Transferred off the farm"),
        clientTransactionId: input.clientTransactionId,
        ...actor(ctx),
      }),
  );
  const previous = pig.status;
  pig.status = input.type;
  await pig.save();
  await writeAudit(ctx, "pig.status", "Pig", String(pig._id), { from: previous, to: input.type, date: input.date });
  return { pigId: pig.pigId, status: pig.status };
}

export async function getPigDetail(ctx: FarmContext, key: string) {
  const pig = await findPig(ctx, key);
  const farmId = farmOid(ctx);
  const currentDay = today(ctx);
  const [weights, movements, vaccinations, incidents, treatments, mortality, breedingAsSow, breedingAsBoar, offspring, birth, sales] =
    await Promise.all([
      PigWeight.find({ farmId, pigId: pig._id }).sort({ date: 1 }).lean(),
      PigMovement.find({ farmId, pigId: pig._id }).sort({ date: -1 }).lean(),
      Vaccination.find({ farmId, pigId: pig._id }).sort({ date: -1 }).lean(),
      HealthIncident.find({ farmId, pigId: pig._id }).sort({ date: -1 }).lean(),
      Treatment.find({ farmId, pigId: pig._id }).sort({ date: -1 }).lean(),
      Mortality.findOne({ farmId, pigId: pig._id }).lean(),
      Breeding.find({ farmId, sowId: pig._id }).sort({ breedingDate: -1 }).lean(),
      Breeding.find({ farmId, boarId: pig._id }).sort({ breedingDate: -1 }).lean(),
      Pig.find({ farmId, $or: [{ motherId: pig._id }, { fatherId: pig._id }] }).sort({ dateOfBirth: -1 }).limit(80).lean(),
      PigBirth.findOne({ farmId, pigId: pig._id }).lean(),
      seesMoney(ctx) ? Sale.find({ farmId, "items.pigId": pig._id }).sort({ date: -1 }).lean() : Promise.resolve([]),
    ]);

  const penIds = [pig.currentPenId, ...movements.flatMap((move) => [move.fromPenId, move.toPenId])].filter(Boolean);
  const pens = await penMap(ctx, penIds);
  const relatives = await Pig.find({
    _id: { $in: definedIds([pig.motherId, pig.fatherId]) },
  }).lean();
  const relativeById = new Map(relatives.map((item) => [String(item._id), item]));
  const litter = birth ? await Litter.findOne({ _id: birth.litterId, farmId }).lean() : null;
  const vaccines = await Vaccine.find({ _id: { $in: vaccinations.map((item) => item.vaccineId) } }).lean();
  const vaccineById = new Map(vaccines.map((item) => [String(item._id), item.name]));
  const partnerIds = [...breedingAsSow.map((item) => item.boarId), ...breedingAsBoar.map((item) => item.sowId)].filter(Boolean);
  const partners = await Pig.find({ _id: { $in: definedIds(partnerIds) } }).lean();
  const partnerById = new Map(partners.map((item) => [String(item._id), item.pigId]));

  const lastMove = movements[0];
  const feedSince = lastMove?.date ?? pig.dateOfBirth ?? null;
  const feedRecords = pig.currentPenId
    ? await FeedRecord.find({
        farmId,
        penId: pig.currentPenId,
        kind: "CONSUMPTION",
        ...(feedSince ? { date: { $gte: feedSince } } : {}),
      })
        .sort({ date: -1 })
        .limit(30)
        .lean()
    : [];
  const feedTypes = await FeedType.find({ _id: { $in: feedRecords.map((record) => record.feedTypeId) } }).lean();
  const feedName = new Map(feedTypes.map((item) => [String(item._id), item.name]));

  const penName = (id: unknown) => {
    if (!id) return "No pen";
    const pen = pens.get(String(id));
    return pen?.label ?? (pen ? formatPenLabel(pen) : "Unknown pen");
  };

  const timeline = [
    ...(pig.dateOfBirth
      ? [{ id: `born-${pig.pigId}`, date: pig.dateOfBirth, title: litter ? `Born — litter ${litter.litterNumber}` : "Born", detail: pig.source === "BORN_ON_FARM" ? "Born on the farm" : labelSource(pig.source) }]
      : []),
    ...weights.map((weight) => ({ id: String(weight._id), date: weight.date, title: `Weight recorded — ${weight.weightKg} kg`, detail: weight.notes || undefined })),
    ...movements.map((move) => ({ id: String(move._id), date: move.date, title: move.toPenId ? `Moved from ${penName(move.fromPenId)} to ${penName(move.toPenId)}` : `Left ${penName(move.fromPenId)}`, detail: move.notes || move.reason })),
    ...vaccinations.map((item) => ({ id: String(item._id), date: item.date, title: `Vaccinated — ${vaccineById.get(String(item.vaccineId)) ?? "Vaccine"}`, detail: item.dose })),
    ...incidents.map((item) => ({ id: String(item._id), date: item.date, title: `Health incident — ${item.severity}`, detail: item.symptoms })),
    ...treatments.map((item) => ({ id: String(item._id), date: item.date, title: `Treatment — ${item.product}`, detail: item.dose })),
    ...breedingAsSow.map((item) => ({ id: String(item._id), date: item.breedingDate, title: `Served — ${item.status}`, detail: item.method })),
    ...(mortality ? [{ id: String(mortality._id), date: mortality.date, title: "Mortality recorded", detail: mortality.suspectedCause || mortality.confirmedCause || undefined }] : []),
    ...sales.map((sale) => ({ id: String(sale._id), date: sale.date, title: `Sold to ${sale.buyerName}`, detail: undefined })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const nameOf = (id: unknown) => {
    if (!id) return null;
    const relative = relativeById.get(String(id));
    return relative ? { id: String(relative._id), pigId: relative.pigId } : null;
  };

  return {
    pig: {
      ...toListItem(pig.toObject(), pens, currentDay),
      qrCode: pig.qrCode,
      notes: pig.notes ?? "",
      weighedOn: pig.currentStats.weighedOn,
      mother: nameOf(pig.motherId),
      father: nameOf(pig.fatherId),
      litterNumber: litter?.litterNumber ?? null,
      litterId: litter ? String(litter._id) : null,
      acquisition: pig.acquisition
        ? {
            date: pig.acquisition.date ?? null,
            supplier: pig.acquisition.supplier ?? null,
            price: seesMoney(ctx) ? (pig.acquisition.price ?? null) : null,
          }
        : null,
      photoUrl: pig.photo?.url ?? null,
    },
    weights: weights.map((weight) => ({
      id: String(weight._id),
      date: weight.date,
      weightKg: weight.weightKg,
      notes: weight.notes ?? "",
      recordedByName: weight.recordedByName,
    })),
    movements: movements.map((move) => ({
      id: String(move._id),
      date: move.date,
      fromLabel: penName(move.fromPenId),
      toLabel: move.toPenId ? penName(move.toPenId) : "Off farm",
      reason: move.reason,
      notes: move.notes ?? "",
    })),
    vaccinations: vaccinations.map((item) => ({
      id: String(item._id),
      date: item.date,
      vaccine: vaccineById.get(String(item.vaccineId)) ?? "Vaccine",
      dose: item.dose,
      batchNumber: item.batchNumber ?? "",
      nextDueDate: item.nextDueDate ?? null,
      administeredByName: item.administeredByName,
    })),
    incidents: incidents.map((item) => ({
      id: String(item._id),
      date: item.date,
      severity: item.severity,
      status: item.status,
      symptoms: item.symptoms,
      notes: item.notes ?? "",
    })),
    treatments: treatments.map((item) => ({
      id: String(item._id),
      date: item.date,
      product: item.product,
      dose: item.dose,
      route: item.route ?? "",
      notes: item.notes ?? "",
    })),
    mortality: mortality
      ? {
          date: mortality.date,
          weightKg: mortality.weightKg ?? null,
          ageDays: mortality.ageDays,
          suspectedCause: mortality.suspectedCause ?? "",
          confirmedCause: mortality.confirmedCause ?? "",
          notes: mortality.notes ?? "",
        }
      : null,
    breeding: [...breedingAsSow, ...breedingAsBoar]
      .map((item) => ({
        id: String(item._id),
        date: item.breedingDate,
        role: String(item.sowId) === String(pig._id) ? "Sow" : "Boar",
        partner: partnerById.get(String(String(item.sowId) === String(pig._id) ? item.boarId : item.sowId)) ?? "—",
        method: item.method,
        status: item.status,
        expectedFarrowDate: item.expectedFarrowDate,
        actualFarrowDate: item.actualFarrowDate ?? null,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
    offspring: offspring.map((child) => ({
      id: String(child._id),
      pigId: child.pigId,
      sex: child.sex,
      status: child.status,
      dateOfBirth: child.dateOfBirth,
    })),
    feed: feedRecords.map((record) => ({
      id: String(record._id),
      date: record.date,
      feedName: feedName.get(String(record.feedTypeId)) ?? "Feed",
      quantityKg: record.quantityKg,
      penLabel: penName(record.penId),
    })),
    timeline,
    sales: sales.map((sale) => ({
      id: String(sale._id),
      date: sale.date,
      buyerName: sale.buyerName,
      amount: sale.items.find((item) => String(item.pigId) === String(pig._id))?.price ?? sale.totalAmount,
    })),
  };
}

function labelSource(source: PigSource): string {
  if (source === "PURCHASED") return "Purchased";
  if (source === "TRANSFERRED") return "Transferred in";
  if (source === "BORN_ON_FARM") return "Born on farm";
  return "Source not recorded";
}

export async function housingOptions(ctx: FarmContext) {
  const [buildings, pens] = await Promise.all([
    Building.find({ farmId: farmOid(ctx), isActive: true }).sort({ code: 1 }).lean(),
    Pen.find({ farmId: farmOid(ctx), isActive: true }).sort({ code: 1 }).lean(),
  ]);
  const buildingName = new Map(buildings.map((building) => [String(building._id), building.name]));
  return pens.map((pen) => ({
    value: String(pen._id),
    label: formatPenLabel(pen, buildingName.get(String(pen.buildingId))),
    keywords: `${pen.code} ${pen.name} ${buildingName.get(String(pen.buildingId)) ?? ""}`,
    description: penPurpose(pen.type),
  }));
}
