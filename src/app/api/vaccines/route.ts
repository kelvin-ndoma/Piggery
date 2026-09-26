import { apiHandler, parseJson } from "@/lib/api";
import { vaccineSchema } from "@/schemas";
import { createVaccine, listVaccines } from "@/services/health";

export const GET = apiHandler(async (_request, ctx) => listVaccines(ctx), { permission: "pigs:read" });

export const POST = apiHandler(async (request, ctx) => createVaccine(ctx, await parseJson(request, vaccineSchema)), {
  permission: "health:write",
  mutation: true,
});
