import { apiHandler, parseJson } from "@/lib/api";
import { buildingSchema } from "@/schemas";
import { createBuilding } from "@/services/housing";

export const POST = apiHandler(async (request, ctx) => createBuilding(ctx, await parseJson(request, buildingSchema)), {
  permission: "housing:write",
  mutation: true,
});
