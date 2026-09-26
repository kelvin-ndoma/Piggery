import { apiHandler, parseJson } from "@/lib/api";
import { incidentStatusSchema } from "@/schemas";
import { updateIncidentStatus } from "@/services/health";

export const PATCH = apiHandler(async (request, ctx, route) => {
  const { id } = await route.params;
  return updateIncidentStatus(ctx, id, await parseJson(request, incidentStatusSchema));
}, { permission: "health:write", mutation: true });
