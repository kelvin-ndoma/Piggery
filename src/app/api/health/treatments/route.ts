import { apiHandler, parseJson } from "@/lib/api";
import { treatmentSchema } from "@/schemas";
import { recordTreatment } from "@/services/health";

export const POST = apiHandler(async (request, ctx) => recordTreatment(ctx, await parseJson(request, treatmentSchema)), {
  permission: "health:write",
  mutation: true,
});
