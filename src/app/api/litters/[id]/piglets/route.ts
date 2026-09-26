import { apiHandler, parseJson } from "@/lib/api";
import { pigletSchema } from "@/schemas";
import { registerPiglets } from "@/services/breeding";

export const POST = apiHandler(async (request, ctx, route) => {
  const { id } = await route.params;
  return registerPiglets(ctx, id, await parseJson(request, pigletSchema));
}, { permission: "breeding:write", mutation: true });
