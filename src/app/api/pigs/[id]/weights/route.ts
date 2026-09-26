import { apiHandler, parseJson } from "@/lib/api";
import { weightSchema } from "@/schemas";
import { recordWeight } from "@/services/growth";

export const POST = apiHandler(async (request, ctx, route) => {
  const { id } = await route.params;
  return recordWeight(ctx, id, await parseJson(request, weightSchema));
}, { permission: "weights:write", mutation: true });
