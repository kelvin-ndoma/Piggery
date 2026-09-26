import { apiHandler, parseJson } from "@/lib/api";
import { visitSchema } from "@/schemas";
import { createVisit, listVisits } from "@/services/visits";

export const GET = apiHandler(async (_request, ctx) => listVisits(ctx), { permission: "pigs:read" });

export const POST = apiHandler(async (request, ctx) => createVisit(ctx, await parseJson(request, visitSchema)), {
  permission: "visits:write",
  mutation: true,
});
