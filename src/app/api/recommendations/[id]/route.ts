import { apiHandler, parseJson } from "@/lib/api";
import { recommendationUpdateSchema } from "@/schemas";
import { updateRecommendation } from "@/services/visits";

export const PATCH = apiHandler(async (request, ctx, route) => {
  const { id } = await route.params;
  return updateRecommendation(ctx, id, await parseJson(request, recommendationUpdateSchema));
}, { permission: "visits:write", mutation: true });
