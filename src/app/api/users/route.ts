import { apiHandler, parseJson } from "@/lib/api";
import { createUserSchema } from "@/schemas";
import { createTeamUser, listTeam } from "@/services/team";

export const GET = apiHandler(async (_request, ctx) => listTeam(ctx), { permission: "users:manage" });

export const POST = apiHandler(async (request, ctx) => createTeamUser(ctx, await parseJson(request, createUserSchema)), {
  permission: "users:manage",
  mutation: true,
});
