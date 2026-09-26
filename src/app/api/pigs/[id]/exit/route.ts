import { apiHandler, parseJson } from "@/lib/api";
import { exitSchema } from "@/schemas";
import { recordExit } from "@/services/pigs";

export const POST = apiHandler(async (request, ctx, route) => {
  const { id } = await route.params;
  return recordExit(ctx, id, await parseJson(request, exitSchema));
}, { permission: "pigs:write", mutation: true });
