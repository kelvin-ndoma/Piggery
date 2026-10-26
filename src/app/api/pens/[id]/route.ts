import { apiHandler, parseJson } from "@/lib/api";
import { updatePenSchema } from "@/schemas";
import { updatePen } from "@/services/housing";

export const PATCH = apiHandler(
  async (request, ctx, route) => {
    const { id } = await route.params;
    return updatePen(ctx, id, await parseJson(request, updatePenSchema));
  },
  { permission: "housing:write", mutation: true },
);
