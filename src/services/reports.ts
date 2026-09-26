import "server-only";
import { addDays, daysBetween, monthBounds } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { roundTo } from "@/lib/rules";
import type { FarmContext } from "@/lib/context";
import { Breeding, Litter } from "@/models/breeding";
import { Expense, FarmVisit, Sale } from "@/models/operations";
import { FeedRecord, FeedType } from "@/models/feed";
import { HealthIncident, Mortality } from "@/models/health";
import { Pig, PigWeight } from "@/models/pig";
import { OPEN_HEALTH_STATUSES, type HealthSeverity } from "@/types/domain";
import { farmOid, seesMoney, today } from "@/services/support";
import { inventorySummary } from "@/services/feed";
import { vaccinationBoard } from "@/services/health";

const SEVERITY_RANK: Record<HealthSeverity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export async function dashboardReport(ctx: FarmContext) {
  const farmId = farmOid(ctx);
  const currentDay = today(ctx);
  const month = monthBounds(currentDay);
  const [pigs, openIncidents, litters, breeding, feedTypes, salesCount, expenseCount] = await Promise.all([
    Pig.find({ farmId }).select("status category currentStats dateOfBirth").lean(),
    HealthIncident.find({ farmId, status: { $in: [...OPEN_HEALTH_STATUSES] } }).select("pigId severity").lean(),
    Litter.find({ farmId, birthDate: { $gte: month.from, $lte: month.to } }).lean(),
    Breeding.find({ farmId, status: "CONFIRMED_PREGNANT" }).select("expectedFarrowDate").lean(),
    FeedType.countDocuments({ farmId }),
    Sale.countDocuments({ farmId }),
    Expense.countDocuments({ farmId }),
  ]);

  const registered = pigs.length;
  const active = pigs.filter((pig) => pig.status === "ACTIVE");
  const byCategory = (category: string) => active.filter((pig) => pig.category === category).length;
  const activeIds = new Set(active.map((pig) => String(pig._id)));
  const worst = new Map<string, HealthSeverity>();
  for (const incident of openIncidents) {
    const id = String(incident.pigId);
    if (!activeIds.has(id)) continue;
    const current = worst.get(id);
    if (!current || SEVERITY_RANK[incident.severity] > SEVERITY_RANK[current]) worst.set(id, incident.severity);
  }
  let critical = 0;
  let sick = 0;
  let observation = 0;
  for (const pig of active) {
    const severity = worst.get(String(pig._id));
    if (severity === "CRITICAL") critical += 1;
    else if (severity === "HIGH" || severity === "MEDIUM") sick += 1;
    else if (severity === "LOW") observation += 1;
  }

  const weighed = active.map((pig) => pig.currentStats?.weightKg).filter((value): value is number => typeof value === "number");
  const gains = active.map((pig) => pig.currentStats?.adgKg).filter((value): value is number => typeof value === "number");
  const averageWeight = weighed.length ? roundTo(weighed.reduce((sum, value) => sum + value, 0) / weighed.length, 1) : null;
  const averageAdg = gains.length ? roundTo(gains.reduce((sum, value) => sum + value, 0) / gains.length, 3) : null;

  const monthWeights = await PigWeight.find({ farmId, date: { $lte: month.to } }).select("pigId date weightKg").lean();
  let gainKg = 0;
  let gainPigs = 0;
  const byPig = new Map<string, Array<{ date: string; weightKg: number }>>();
  for (const weight of monthWeights) {
    const key = String(weight.pigId);
    const list = byPig.get(key) ?? [];
    list.push({ date: weight.date, weightKg: weight.weightKg });
    byPig.set(key, list);
  }
  for (const points of byPig.values()) {
    points.sort((a, b) => (a.date < b.date ? -1 : 1));
    const inMonth = points.filter((point) => point.date >= month.from && point.date <= month.to);
    const before = [...points].reverse().find((point) => point.date < month.from);
    const end = inMonth.at(-1);
    const start = before ?? (inMonth.length > 1 ? inMonth[0] : undefined);
    if (!start || !end || start.date === end.date) continue;
    gainKg += end.weightKg - start.weightKg;
    gainPigs += 1;
  }

  const horizon = addDays(currentDay, ctx.farm.settings.farrowingHorizonDays);
  const vaccines = await vaccinationBoard(ctx);
  const stock = feedTypes > 0 ? await inventorySummary(ctx) : null;
  const todayFeed = feedTypes
    ? await FeedRecord.aggregate<{ _id: null; quantity: number }>([
        { $match: { farmId, date: currentDay, kind: "CONSUMPTION" } },
        { $group: { _id: null, quantity: { $sum: "$quantityKg" } } },
      ])
    : [];

  let financial: { sales: number; expenses: number; margin: number } | null = null;
  if (seesMoney(ctx) && salesCount + expenseCount > 0) {
    const [saleRows, expenseRows] = await Promise.all([
      Sale.aggregate<{ _id: null; total: number }>([
        { $match: { farmId, date: { $gte: month.from, $lte: month.to } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Expense.aggregate<{ _id: null; total: number }>([
        { $match: { farmId, date: { $gte: month.from, $lte: month.to } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);
    const sales = saleRows[0]?.total ?? 0;
    const expenses = expenseRows[0]?.total ?? 0;
    financial = { sales, expenses, margin: roundTo(sales - expenses, 2) };
  }

  return {
    registered,
    herd: {
      total: active.length,
      historical: registered - active.length,
      sows: byCategory("SOW"),
      boars: byCategory("BOAR"),
      piglets: byCategory("PIGLET"),
      growers: byCategory("GROWER"),
      finishers: byCategory("FINISHER"),
    },
    health: registered
      ? { healthy: active.length - critical - sick - observation, observation, sick, critical }
      : null,
    vaccination: vaccines.hasRecords
      ? { dueToday: vaccines.dueToday.length, dueThisWeek: vaccines.dueThisWeek.length, overdue: vaccines.overdue.length }
      : null,
    breeding: {
      hasRecords: (await Breeding.countDocuments({ farmId })) > 0 || litters.length > 0,
      pregnant: breeding.length,
      expectedFarrowings: breeding.filter((item) => item.expectedFarrowDate <= horizon).length,
      birthsThisMonth: litters.reduce((sum, litter) => sum + litter.bornAlive, 0),
    },
    growth: {
      averageWeight,
      averageAdg,
      gainThisMonth: gainPigs > 0 ? roundTo(gainKg, 1) : null,
    },
    feed: stock
      ? {
          todayKg: todayFeed[0]?.quantity ?? 0,
          inventoryKg: roundTo(stock.totalKg, 1),
          low: stock.low.map((item) => ({ name: item.name, quantityKg: item.quantityKg })),
        }
      : null,
    financial,
    currency: ctx.farm.settings.currency,
  };
}

export function resolveRange(currentDay: string, query: { from?: string; to?: string }) {
  const fallback = { from: addDays(currentDay, -30), to: currentDay };
  return {
    from: query.from || fallback.from,
    to: query.to || fallback.to,
  };
}

export async function herdSummaryText(ctx: FarmContext): Promise<string> {
  const pigs = await Pig.find({ farmId: farmOid(ctx), status: "ACTIVE" }).select("category").lean();
  if (pigs.length === 0) return "No active pigs were on record when this visit was opened.";
  const count = (category: string) => pigs.filter((pig) => pig.category === category).length;
  return `Active pigs on record: ${pigs.length}. Sows ${count("SOW")}, boars ${count("BOAR")}, piglets ${count("PIGLET")}, growers ${count("GROWER")}, finishers ${count("FINISHER")}.`;
}

export async function populationReport(ctx: FarmContext) {
  const pigs = await Pig.find({ farmId: farmOid(ctx) }).sort({ pigId: 1 }).lean();
  return pigs.map((pig) => ({
    pigId: pig.pigId,
    sex: pig.sex,
    breed: pig.breed,
    category: pig.category,
    status: pig.status,
    dateOfBirth: pig.dateOfBirth,
    weightKg: pig.currentStats?.weightKg ?? null,
  }));
}

export async function growthReport(ctx: FarmContext, from: string, to: string) {
  const weights = await PigWeight.find({ farmId: farmOid(ctx), date: { $gte: from, $lte: to } }).sort({ date: 1 }).lean();
  const pigs = await Pig.find({ _id: { $in: weights.map((weight) => weight.pigId) } }).select("pigId").lean();
  const codes = new Map(pigs.map((pig) => [String(pig._id), pig.pigId]));
  return weights.map((weight) => ({
    pigId: codes.get(String(weight.pigId)) ?? "Pig",
    date: weight.date,
    weightKg: weight.weightKg,
    daysFromStart: daysBetween(from, weight.date),
  }));
}

export async function healthReport(ctx: FarmContext, from: string, to: string) {
  const incidents = await HealthIncident.find({ farmId: farmOid(ctx), date: { $gte: from, $lte: to } }).sort({ date: -1 }).lean();
  const pigs = await Pig.find({ _id: { $in: incidents.map((item) => item.pigId) } }).select("pigId").lean();
  const codes = new Map(pigs.map((pig) => [String(pig._id), pig.pigId]));
  return incidents.map((incident) => ({
    pigId: codes.get(String(incident.pigId)) ?? "Pig",
    date: incident.date,
    severity: incident.severity,
    status: incident.status,
    symptoms: incident.symptoms,
  }));
}

export async function breedingReport(ctx: FarmContext, from: string, to: string) {
  const [breeding, litters] = await Promise.all([
    Breeding.find({ farmId: farmOid(ctx), breedingDate: { $gte: from, $lte: to } }).lean(),
    Litter.find({ farmId: farmOid(ctx), birthDate: { $gte: from, $lte: to } }).lean(),
  ]);
  return {
    breeding: breeding.map((item) => ({
      date: item.breedingDate,
      status: item.status,
      method: item.method,
      expectedFarrowDate: item.expectedFarrowDate,
    })),
    litters: litters.map((litter) => ({
      litterNumber: litter.litterNumber,
      birthDate: litter.birthDate,
      bornAlive: litter.bornAlive,
      stillborn: litter.stillborn,
      male: litter.male,
      female: litter.female,
      currentlyAlive: litter.currentlyAlive,
    })),
  };
}

export async function feedReport(ctx: FarmContext, from: string, to: string) {
  const records = await FeedRecord.find({ farmId: farmOid(ctx), date: { $gte: from, $lte: to } }).sort({ date: 1 }).lean();
  const types = await FeedType.find({ farmId: farmOid(ctx) }).lean();
  const names = new Map(types.map((type) => [String(type._id), type.name]));
  const showCost = can(ctx.role, "finance:read");
  return records.map((record) => ({
    date: record.date,
    feed: names.get(String(record.feedTypeId)) ?? "Feed",
    kind: record.kind,
    quantityKg: record.quantityKg,
    totalCost: showCost ? record.totalCost : null,
  }));
}

export async function mortalityReport(ctx: FarmContext, from: string, to: string) {
  const records = await Mortality.find({ farmId: farmOid(ctx), date: { $gte: from, $lte: to } }).sort({ date: -1 }).lean();
  const pigs = await Pig.find({ _id: { $in: records.map((record) => record.pigId) } }).select("pigId category").lean();
  const codes = new Map(pigs.map((pig) => [String(pig._id), pig]));
  return records.map((record) => ({
    pigId: codes.get(String(record.pigId))?.pigId ?? "Pig",
    category: codes.get(String(record.pigId))?.category ?? "",
    date: record.date,
    ageDays: record.ageDays,
    weightKg: record.weightKg ?? null,
    suspectedCause: record.suspectedCause ?? "",
    confirmedCause: record.confirmedCause ?? "",
  }));
}

export async function financialReport(ctx: FarmContext, from: string, to: string) {
  if (!can(ctx.role, "finance:read")) throw new AppError("FORBIDDEN", "You do not have permission to do that.", 403);
  const farmId = farmOid(ctx);
  const [sales, expenses] = await Promise.all([
    Sale.find({ farmId, date: { $gte: from, $lte: to } }).lean(),
    Expense.find({ farmId, date: { $gte: from, $lte: to } }).lean(),
  ]);
  const salesTotal = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return {
    salesTotal: roundTo(salesTotal, 2),
    expenseTotal: roundTo(expenseTotal, 2),
    margin: roundTo(salesTotal - expenseTotal, 2),
    currency: ctx.farm.settings.currency,
    sales: sales.map((sale) => ({ date: sale.date, buyerName: sale.buyerName, totalAmount: sale.totalAmount })),
    expenses: expenses.map((expense) => ({ date: expense.date, category: expense.category, description: expense.description, amount: expense.amount })),
  };
}

export async function visitReport(ctx: FarmContext, from: string, to: string) {
  const visits = await FarmVisit.find({ farmId: farmOid(ctx), date: { $gte: from, $lte: to } }).sort({ date: -1 }).lean();
  return visits.map((visit) => ({
    visitNumber: visit.visitNumber,
    date: visit.date,
    farmerName: visit.farmerName,
    visitingOfficer: visit.visitingOfficer,
    housing: visit.housing.rating,
    health: visit.health.rating,
    water: visit.water.rating,
    feeding: visit.feeding.rating,
    feedQuality: visit.feedQuality.rating,
    nextVisitDate: visit.nextVisitDate ?? "",
  }));
}
