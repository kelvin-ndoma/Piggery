import { apiHandler, parseJson } from "@/lib/api";
import { vaccinationSchema } from "@/schemas";
import { recordVaccination, vaccinationBoard } from "@/services/health";

export const GET = apiHandler(async (_request, ctx) => vaccinationBoard(ctx), { permission: "pigs:read" });

export const POST = apiHandler(async (request, ctx) => recordVaccination(ctx, await parseJson(request, vaccinationSchema)), {
  permission: "health:write",
  mutation: true,
});
