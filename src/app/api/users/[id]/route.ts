import { apiHandler, parseJson } from "@/lib/api";
import { updateUserSchema } from "@/schemas";
import { removeTeamUser, updateTeamUser } from "@/services/team";

export const PATCH = apiHandler(async (request, ctx, route) => {
  const { id } = await route.params;
  return updateTeamUser(ctx, id, await parseJson(request, updateUserSchema));
}, { permission: "users:manage", mutation: true });

export const DELETE = apiHandler(async (_request, ctx, route) => {
  const { id } = await route.params;
  return removeTeamUser(ctx, id);
}, { permission: "users:manage", mutation: true });
