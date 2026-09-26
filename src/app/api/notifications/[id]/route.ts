import { apiHandler } from "@/lib/api";
import { markNotificationRead } from "@/services/notifications";

export const POST = apiHandler(async (_request, ctx, route) => {
  const { id } = await route.params;
  return markNotificationRead(ctx, id);
}, { mutation: true });
