import { apiHandler, parseJson } from "@/lib/api";
import { breedingSchema } from "@/schemas";
import { listBreeding, recordBreeding } from "@/services/breeding";

export const GET = apiHandler(async (_request, ctx) => listBreeding(ctx), { permission: "pigs:read" });

export const POST = apiHandler(async (request, ctx) => recordBreeding(ctx, await parseJson(request, breedingSchema)), {
  permission: "breeding:write",
  mutation: true,
});
