import { apiHandler, parseJson } from "@/lib/api";
import { litterSchema } from "@/schemas";
import { listLitters, recordLitter } from "@/services/breeding";

export const GET = apiHandler(async (_request, ctx) => listLitters(ctx), { permission: "pigs:read" });

export const POST = apiHandler(async (request, ctx) => recordLitter(ctx, await parseJson(request, litterSchema)), {
  permission: "breeding:write",
  mutation: true,
});
