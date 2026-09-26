import { apiHandler, parseJson } from "@/lib/api";
import { movementSchema } from "@/schemas";
import { recordMovement } from "@/services/pigs";

export const POST = apiHandler(async (request, ctx, route) => {
  const { id } = await route.params;
  return recordMovement(ctx, id, await parseJson(request, movementSchema));
}, { permission: "pigs:write", mutation: true });
