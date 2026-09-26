import "server-only";
import { formatVisitNumber } from "@/lib/ids";
import { AppError } from "@/lib/errors";
import { definedIds, toObjectId } from "@/lib/object-id";
import type { FarmContext } from "@/lib/context";
import { FarmRecommendation, FarmVisit } from "@/models/operations";
import { User } from "@/models/user";
import type { VisitInput } from "@/schemas";
import type { TaskStatus } from "@/types/domain";
import { assertNotFuture, farmOid, nextSequence, notify, reuseOrCreate, today, writeAudit } from "@/services/support";

export async function listVisits(ctx: FarmContext) {
  const visits = await FarmVisit.find({ farmId: farmOid(ctx) }).sort({ date: -1 }).limit(50).lean();
  const recommendations = await FarmRecommendation.find({ farmId: farmOid(ctx), visitId: { $in: visits.map((visit) => visit._id) } }).lean();
  return visits.map((visit) => ({
    id: String(visit._id),
    visitNumber: visit.visitNumber,
    date: visit.date,
    farmerName: visit.farmerName,
    visitingOfficer: visit.visitingOfficer,
    nextVisitDate: visit.nextVisitDate ?? null,
    openTasks: recommendations.filter((item) => String(item.visitId) === String(visit._id) && item.status !== "DONE" && item.status !== "CANCELLED").length,
  }));
}

export async function getVisit(ctx: FarmContext, id: string) {
  const visit = await FarmVisit.findOne({ _id: id, farmId: farmOid(ctx) }).lean();
  if (!visit) throw new AppError("NOT_FOUND", "That farm visit was not found.", 404);
  const recommendations = await FarmRecommendation.find({ farmId: farmOid(ctx), visitId: visit._id }).lean();
  const users = await User.find({ _id: { $in: definedIds(recommendations.map((item) => item.assignedUserId)) } }).select("name").lean();
  const names = new Map(users.map((user) => [String(user._id), user.name]));
  return {
    id: String(visit._id),
    visitNumber: visit.visitNumber,
    date: visit.date,
    farmerName: visit.farmerName,
    otherContactName: visit.otherContactName ?? "",
    contactPhone: visit.contactPhone ?? "",
    populationSummary: visit.populationSummary,
    housing: visit.housing,
    health: visit.health,
    water: visit.water,
    feeding: visit.feeding,
    feedQuality: visit.feedQuality,
    otherComments: visit.otherComments ?? "",
    visitingOfficer: visit.visitingOfficer,
    nextVisitDate: visit.nextVisitDate ?? null,
    recommendations: recommendations.map((item) => ({
      id: String(item._id),
      text: item.text,
      priority: item.priority,
      status: item.status,
      dueDate: item.dueDate ?? null,
      completedOn: item.completedOn ?? null,
      assignee: item.assignedUserId ? (names.get(String(item.assignedUserId)) ?? "User") : "Unassigned",
    })),
  };
}

export async function createVisit(ctx: FarmContext, input: VisitInput) {
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Visit date");
  const farmId = farmOid(ctx);
  const visit = await reuseOrCreate(
    async () =>
      input.clientTransactionId ? FarmVisit.findOne({ farmId, clientTransactionId: input.clientTransactionId }) : null,
    async () => {
      const year = Number(input.date.slice(0, 4));
      const visitNumber = formatVisitNumber(year, await nextSequence(farmId, `visit:${year}`));
      return FarmVisit.create({
        farmId,
        visitNumber,
        date: input.date,
        farmerName: input.farmerName,
        otherContactName: input.otherContactName,
        contactPhone: input.contactPhone,
        populationSummary: input.populationSummary,
        housing: input.housing,
        health: input.health,
        water: input.water,
        feeding: input.feeding,
        feedQuality: input.feedQuality,
        otherComments: input.otherComments,
        visitingOfficer: input.visitingOfficer,
        nextVisitDate: input.nextVisitDate,
        clientTransactionId: input.clientTransactionId,
      });
    },
  );

  if (input.recommendations?.length) {
    const existingCount = await FarmRecommendation.countDocuments({ farmId, visitId: visit._id });
    if (existingCount === 0) {
      await FarmRecommendation.insertMany(
        input.recommendations.map((item) => ({
          farmId,
          visitId: visit._id,
          text: item.text,
          priority: item.priority,
          status: "OPEN",
          assignedUserId: item.assignedUserId ? toObjectId(item.assignedUserId) : undefined,
          dueDate: item.dueDate,
        })),
      );
      for (const item of input.recommendations) {
        await notify({
          ctx,
          type: "RECOMMENDATION",
          title: "Farm visit recommendation",
          body: item.text,
          href: `/visits/${String(visit._id)}`,
          dedupeKey: `recommendation:${String(visit._id)}:${item.text.slice(0, 40)}`,
          userId: item.assignedUserId,
        });
      }
    }
  }
  await writeAudit(ctx, "visit.create", "FarmVisit", String(visit._id), { visitNumber: visit.visitNumber });
  return { id: String(visit._id), visitNumber: visit.visitNumber };
}

export async function updateRecommendation(
  ctx: FarmContext,
  id: string,
  input: { status: TaskStatus; assignedUserId?: string; dueDate?: string; completedOn?: string },
) {
  const item = await FarmRecommendation.findOne({ _id: id, farmId: farmOid(ctx) });
  if (!item) throw new AppError("NOT_FOUND", "That recommendation was not found.", 404);
  item.status = input.status;
  if (input.assignedUserId !== undefined) item.assignedUserId = input.assignedUserId ? toObjectId(input.assignedUserId) : null;
  if (input.dueDate !== undefined) item.dueDate = input.dueDate;
  if (input.status === "DONE") item.completedOn = input.completedOn ?? today(ctx);
  if (input.status !== "DONE") item.completedOn = input.completedOn;
  await item.save();
  await writeAudit(ctx, "recommendation.update", "FarmRecommendation", String(item._id), { status: item.status });
  return { id: String(item._id), status: item.status };
}

export async function openRecommendations(ctx: FarmContext) {
  const items = await FarmRecommendation.find({
    farmId: farmOid(ctx),
    status: { $in: ["OPEN", "IN_PROGRESS"] },
  })
    .sort({ dueDate: 1 })
    .limit(20)
    .lean();
  return items.map((item) => ({
    id: String(item._id),
    text: item.text,
    priority: item.priority,
    status: item.status,
    dueDate: item.dueDate ?? null,
    visitId: String(item.visitId),
  }));
}
