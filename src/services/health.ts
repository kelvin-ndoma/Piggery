import "server-only";
import { addDays, daysBetween } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { assertCanVaccinate } from "@/lib/rules";
import { toObjectId } from "@/lib/object-id";
import type { Types } from "mongoose";
import type { FarmContext } from "@/lib/context";
import { HealthIncident, Mortality, Treatment, Vaccination, Vaccine } from "@/models/health";
import { Litter } from "@/models/breeding";
import { Pig } from "@/models/pig";
import type { HealthStatus } from "@/types/domain";
import type { IncidentInput, MortalityInput, TreatmentInput, VaccinationInput } from "@/schemas";
import {
  actor,
  assertNotFuture,
  farmOid,
  findPig,
  notify,
  reuseOrCreate,
  today,
  writeAudit,
} from "@/services/support";

async function closeOpenIncidents(ctx: FarmContext, pigId: Types.ObjectId, note: string) {
  const currentDay = today(ctx);
  const open = await HealthIncident.find({
    farmId: farmOid(ctx),
    pigId,
    status: { $in: ["OPEN", "UNDER_TREATMENT", "REFERRED"] },
  });
  for (const incident of open) {
    incident.statusHistory.push({ status: "CLOSED", at: currentDay, userId: toObjectId(ctx.userId), note });
    incident.status = "CLOSED";
    await incident.save();
  }
}

export async function listVaccines(ctx: FarmContext) {
  const vaccines = await Vaccine.find({ farmId: farmOid(ctx) }).sort({ name: 1 }).lean();
  return vaccines.map((vaccine) => ({
    id: String(vaccine._id),
    name: vaccine.name,
    manufacturer: vaccine.manufacturer ?? "",
    defaultIntervalDays: vaccine.defaultIntervalDays ?? null,
    notes: vaccine.notes ?? "",
    isActive: vaccine.isActive,
  }));
}

export async function createVaccine(
  ctx: FarmContext,
  input: { name: string; manufacturer?: string; defaultIntervalDays?: number | null; notes?: string },
) {
  const vaccine = await Vaccine.create({
    farmId: farmOid(ctx),
    name: input.name,
    manufacturer: input.manufacturer,
    defaultIntervalDays: input.defaultIntervalDays ?? undefined,
    notes: input.notes,
  });
  await writeAudit(ctx, "vaccine.create", "Vaccine", String(vaccine._id), { name: vaccine.name });
  return { id: String(vaccine._id), name: vaccine.name };
}

export async function recordVaccination(ctx: FarmContext, input: VaccinationInput) {
  const pig = await findPig(ctx, input.pigId);
  assertCanVaccinate(pig.status, Boolean(input.recordAsHistorical), ctx.role);
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Vaccination date");
  if (pig.dateOfBirth && input.date < pig.dateOfBirth) {
    throw new AppError("VALIDATION_ERROR", "The vaccination date cannot be before the pig's date of birth.", 400);
  }
  const vaccine = await Vaccine.findOne({ _id: input.vaccineId, farmId: farmOid(ctx), isActive: true });
  if (!vaccine) throw new AppError("VALIDATION_ERROR", "Choose a vaccine from this farm.", 400);
  const nextDueDate =
    input.nextDueDate ??
    (vaccine.defaultIntervalDays ? addDays(input.date, vaccine.defaultIntervalDays) : undefined);
  if (nextDueDate && nextDueDate < input.date) {
    throw new AppError("VALIDATION_ERROR", "The next due date cannot be before the vaccination date.", 400);
  }
  const farmId = farmOid(ctx);
  const record = await reuseOrCreate(
    async () =>
      input.clientTransactionId
        ? Vaccination.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean()
        : null,
    () =>
      Vaccination.create({
        farmId,
        pigId: pig._id,
        vaccineId: vaccine._id,
        date: input.date,
        dose: input.dose,
        batchNumber: input.batchNumber,
        nextDueDate,
        historical: pig.status !== "ACTIVE",
        notes: input.notes,
        clientTransactionId: input.clientTransactionId,
        administeredById: toObjectId(ctx.userId),
        administeredByName: ctx.userName,
      }),
  );
  await writeAudit(ctx, "vaccination.create", "Vaccination", String(record._id), {
    pigId: pig.pigId,
    vaccine: vaccine.name,
    date: input.date,
  });
  if (nextDueDate) {
    await notify({
      ctx,
      type: "VACCINATION_DUE",
      title: `Vaccination due ${nextDueDate}`,
      body: `${pig.pigId} is due for ${vaccine.name}.`,
      href: `/pigs/${pig.pigId}?tab=vaccinations`,
      dedupeKey: `vaccination:${String(record._id)}:${nextDueDate}`,
    });
  }
  return { id: String(record._id), pigId: pig.pigId };
}

export async function vaccinationBoard(ctx: FarmContext) {
  const farmId = farmOid(ctx);
  const currentDay = today(ctx);
  const weekEnd = addDays(currentDay, 7);
  const recentStart = addDays(currentDay, -14);
  const [vaccines, records, activePigs] = await Promise.all([
    Vaccine.find({ farmId }).lean(),
    Vaccination.find({ farmId }).sort({ date: -1 }).limit(200).lean(),
    Pig.find({ farmId, status: "ACTIVE" }).select("_id pigId").lean(),
  ]);
  const active = new Set(activePigs.map((pig) => String(pig._id)));
  const pigCode = new Map(activePigs.map((pig) => [String(pig._id), pig.pigId]));
  const vaccineName = new Map(vaccines.map((vaccine) => [String(vaccine._id), vaccine.name]));
  const latest = new Map<string, (typeof records)[number]>();
  for (const record of records) {
    const key = `${String(record.pigId)}:${String(record.vaccineId)}`;
    const current = latest.get(key);
    if (!current || record.date > current.date) latest.set(key, record);
  }
  const due = [...latest.values()].filter((record) => record.nextDueDate && active.has(String(record.pigId)));
  const mapDue = (record: (typeof records)[number]) => ({
    id: String(record._id),
    pigId: pigCode.get(String(record.pigId)) ?? "Pig",
    pigRef: String(record.pigId),
    vaccine: vaccineName.get(String(record.vaccineId)) ?? "Vaccine",
    nextDueDate: record.nextDueDate ?? "",
    date: record.date,
  });
  return {
    overdue: due.filter((record) => (record.nextDueDate ?? "") < currentDay).map(mapDue),
    dueToday: due.filter((record) => record.nextDueDate === currentDay).map(mapDue),
    dueThisWeek: due
      .filter((record) => (record.nextDueDate ?? "") > currentDay && (record.nextDueDate ?? "") <= weekEnd)
      .map(mapDue),
    recent: records
      .filter((record) => record.date >= recentStart && record.date <= currentDay)
      .slice(0, 40)
      .map((record) => ({
        id: String(record._id),
        pigId: pigCode.get(String(record.pigId)) ?? "Historical pig",
        vaccine: vaccineName.get(String(record.vaccineId)) ?? "Vaccine",
        date: record.date,
        dose: record.dose,
        batchNumber: record.batchNumber ?? "",
        nextDueDate: record.nextDueDate ?? null,
        administeredByName: record.administeredByName,
      })),
    hasRecords: records.length > 0,
  };
}

export async function recordIncident(ctx: FarmContext, input: IncidentInput) {
  const pig = await findPig(ctx, input.pigId);
  if (pig.status !== "ACTIVE") {
    throw new AppError("VALIDATION_ERROR", "Health incidents are recorded for active pigs.", 400);
  }
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Incident date");
  const farmId = farmOid(ctx);
  const incident = await reuseOrCreate(
    async () =>
      input.clientTransactionId
        ? HealthIncident.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean()
        : null,
    () =>
      HealthIncident.create({
        farmId,
        pigId: pig._id,
        date: input.date,
        severity: input.severity,
        status: "OPEN",
        symptoms: input.symptoms,
        notes: input.notes,
        statusHistory: [{ status: "OPEN", at: input.date, userId: toObjectId(ctx.userId) }],
        clientTransactionId: input.clientTransactionId,
        ...actor(ctx),
      }),
  );
  await writeAudit(ctx, "health.create", "HealthIncident", String(incident._id), {
    pigId: pig.pigId,
    severity: input.severity,
  });
  if (input.severity === "CRITICAL" || input.severity === "HIGH") {
    await notify({
      ctx,
      type: "HEALTH",
      title: `${input.severity === "CRITICAL" ? "Critical" : "High"} health incident`,
      body: `${pig.pigId}: ${input.symptoms}`,
      href: `/pigs/${pig.pigId}?tab=health`,
      dedupeKey: `incident:${String(incident._id)}`,
    });
  }
  return { id: String(incident._id), pigId: pig.pigId };
}

export async function updateIncidentStatus(ctx: FarmContext, id: string, input: { status: HealthStatus; note?: string }) {
  const incident = await HealthIncident.findOne({ _id: id, farmId: farmOid(ctx) });
  if (!incident) throw new AppError("NOT_FOUND", "That health incident was not found.", 404);
  incident.statusHistory.push({
    status: input.status,
    at: today(ctx),
    userId: toObjectId(ctx.userId),
    note: input.note,
  });
  incident.status = input.status;
  await incident.save();
  await writeAudit(ctx, "health.status", "HealthIncident", String(incident._id), { status: input.status });
  return { id: String(incident._id), status: incident.status };
}

export async function listIncidents(ctx: FarmContext) {
  const farmId = farmOid(ctx);
  const incidents = await HealthIncident.find({ farmId }).sort({ date: -1 }).limit(100).lean();
  const pigs = await Pig.find({ _id: { $in: incidents.map((item) => item.pigId) } }).lean();
  const codes = new Map(pigs.map((pig) => [String(pig._id), pig.pigId]));
  return incidents.map((incident) => ({
    id: String(incident._id),
    pigId: codes.get(String(incident.pigId)) ?? "Pig",
    pigRef: String(incident.pigId),
    date: incident.date,
    severity: incident.severity,
    status: incident.status,
    symptoms: incident.symptoms,
  }));
}

export async function recordTreatment(ctx: FarmContext, input: TreatmentInput) {
  const pig = await findPig(ctx, input.pigId);
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Treatment date");
  if (input.incidentId) {
    const incident = await HealthIncident.findOne({ _id: input.incidentId, farmId: farmOid(ctx), pigId: pig._id });
    if (!incident) throw new AppError("VALIDATION_ERROR", "That health incident does not belong to this pig.", 400);
  }
  const farmId = farmOid(ctx);
  const treatment = await reuseOrCreate(
    async () =>
      input.clientTransactionId
        ? Treatment.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean()
        : null,
    () =>
      Treatment.create({
        farmId,
        pigId: pig._id,
        incidentId: input.incidentId ? toObjectId(input.incidentId) : undefined,
        date: input.date,
        product: input.product,
        dose: input.dose,
        route: input.route,
        notes: input.notes,
        clientTransactionId: input.clientTransactionId,
        administeredById: toObjectId(ctx.userId),
        administeredByName: ctx.userName,
      }),
  );
  if (input.incidentId) {
    await HealthIncident.updateOne(
      { _id: input.incidentId, farmId, status: "OPEN" },
      {
        $set: { status: "UNDER_TREATMENT" },
        $push: { statusHistory: { status: "UNDER_TREATMENT", at: input.date, userId: toObjectId(ctx.userId), note: input.product } },
      },
    );
  }
  await writeAudit(ctx, "treatment.create", "Treatment", String(treatment._id), { pigId: pig.pigId, product: input.product });
  return { id: String(treatment._id) };
}

export async function recordMortality(ctx: FarmContext, input: MortalityInput) {
  const pig = await findPig(ctx, input.pigId);
  if (pig.status === "DEAD") throw new AppError("CONFLICT", "Mortality is already recorded for this pig.", 409);
  if (pig.status !== "ACTIVE" && pig.status !== "CULLED") {
    throw new AppError("VALIDATION_ERROR", "Record mortality for an active pig. Sold and transferred pigs stay in their own history.", 400);
  }
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Mortality date");
  if (pig.dateOfBirth && input.date < pig.dateOfBirth) {
    throw new AppError("VALIDATION_ERROR", "The mortality date cannot be before the pig's date of birth.", 400);
  }
  const farmId = farmOid(ctx);
  const record = await reuseOrCreate(
    async () =>
      input.clientTransactionId ? Mortality.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean() : null,
    () =>
      Mortality.create({
        farmId,
        pigId: pig._id,
        date: input.date,
        weightKg: input.weightKg ?? undefined,
        ageDays: pig.dateOfBirth ? Math.max(0, daysBetween(pig.dateOfBirth, input.date)) : 0,
        suspectedCause: input.suspectedCause,
        confirmedCause: input.confirmedCause,
        incidentId: input.incidentId ? toObjectId(input.incidentId) : undefined,
        notes: input.notes,
        clientTransactionId: input.clientTransactionId,
        ...actor(ctx),
      }),
  );
  const previous = pig.status;
  pig.status = "DEAD";
  await pig.save();
  if (pig.litterId) {
    await Litter.updateOne({ _id: pig.litterId, farmId, currentlyAlive: { $gt: 0 } }, { $inc: { currentlyAlive: -1 } });
  }
  await closeOpenIncidents(ctx, pig._id, "Closed when mortality was recorded.");
  await writeAudit(ctx, "pig.mortality", "Mortality", String(record._id), { pigId: pig.pigId, from: previous, date: input.date });
  return { pigId: pig.pigId, status: "DEAD" as const };
}
