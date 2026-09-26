import { apiHandler, parseJson } from "@/lib/api";
import { penSchema } from "@/schemas";
import { createPen } from "@/services/housing";

export const POST = apiHandler(async (request, ctx) => createPen(ctx, await parseJson(request, penSchema)), {
  permission: "housing:write",
  mutation: true,
});
