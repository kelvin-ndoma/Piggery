import { apiHandler, parseJson } from "@/lib/api";
import { breedingStatusSchema } from "@/schemas";
import { updateBreedingStatus } from "@/services/breeding";

export const PATCH = apiHandler(async (request, ctx, route) => {
  const { id } = await route.params;
  return updateBreedingStatus(ctx, id, await parseJson(request, breedingStatusSchema));
}, { permission: "breeding:write", mutation: true });
