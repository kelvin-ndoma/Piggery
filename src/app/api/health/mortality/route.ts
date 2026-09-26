import { apiHandler, parseJson } from "@/lib/api";
import { mortalitySchema } from "@/schemas";
import { recordMortality } from "@/services/health";

export const POST = apiHandler(async (request, ctx) => recordMortality(ctx, await parseJson(request, mortalitySchema)), {
  permission: "health:write",
  mutation: true,
});
