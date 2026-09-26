import { apiHandler, parseJson } from "@/lib/api";
import { updatePigSchema } from "@/schemas";
import { getPigDetail, updatePig } from "@/services/pigs";

export const GET = apiHandler(async (_request, ctx, route) => {
  const { id } = await route.params;
  return getPigDetail(ctx, id);
}, { permission: "pigs:read" });

export const PATCH = apiHandler(async (request, ctx, route) => {
  const { id } = await route.params;
  return updatePig(ctx, id, await parseJson(request, updatePigSchema));
}, { permission: "pigs:write", mutation: true });
