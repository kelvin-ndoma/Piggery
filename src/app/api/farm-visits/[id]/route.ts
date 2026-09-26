import { apiHandler } from "@/lib/api";
import { getVisit } from "@/services/visits";

export const GET = apiHandler(async (_request, ctx, route) => {
  const { id } = await route.params;
  return getVisit(ctx, id);
}, { permission: "pigs:read" });
