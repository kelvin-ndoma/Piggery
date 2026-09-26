import { apiHandler, parseJson } from "@/lib/api";
import { incidentSchema } from "@/schemas";
import { listIncidents, recordIncident } from "@/services/health";

export const GET = apiHandler(async (_request, ctx) => listIncidents(ctx), { permission: "pigs:read" });

export const POST = apiHandler(async (request, ctx) => recordIncident(ctx, await parseJson(request, incidentSchema)), {
  permission: "health:write",
  mutation: true,
});
