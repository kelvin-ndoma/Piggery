import "server-only";
import { AppError } from "@/lib/errors";
import { toObjectId } from "@/lib/object-id";
import type { FarmContext } from "@/lib/context";
import { Notification } from "@/models/operations";
import { farmOid } from "@/services/support";

function visibleFilter(ctx: FarmContext) {
  return {
    farmId: farmOid(ctx),
    $or: [{ audience: ctx.role }, { userId: toObjectId(ctx.userId) }],
  };
}

export async function listNotifications(ctx: FarmContext) {
  const items = await Notification.find(visibleFilter(ctx)).sort({ createdAt: -1 }).limit(50).lean();
  const userId = ctx.userId;
  return items.map((item) => ({
    id: String(item._id),
    title: item.title,
    body: item.body,
    href: item.href ?? null,
    type: item.type,
    createdAt: item.createdAt.toISOString(),
    read: item.readBy.some((id) => String(id) === userId),
  }));
}

export async function countUnread(ctx: FarmContext): Promise<number> {
  return Notification.countDocuments({
    ...visibleFilter(ctx),
    readBy: { $ne: toObjectId(ctx.userId) },
  });
}

export async function markNotificationRead(ctx: FarmContext, id: string) {
  const updated = await Notification.updateOne(
    { _id: id, ...visibleFilter(ctx) },
    { $addToSet: { readBy: toObjectId(ctx.userId) } },
  );
  if (updated.matchedCount === 0) throw new AppError("NOT_FOUND", "That notification was not found.", 404);
  return { id };
}
