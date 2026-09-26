import { apiHandler, parseJson } from "@/lib/api";
import { farmSettingsSchema, switchFarmSchema } from "@/schemas";
import { switchFarm, updateFarmSettings } from "@/services/team";

export const PATCH = apiHandler(async (request, ctx) => updateFarmSettings(ctx, await parseJson(request, farmSettingsSchema)), {
  permission: "farm:manage",
  mutation: true,
});

export const POST = apiHandler(async (request, ctx) => {
  const body = await parseJson(request, switchFarmSchema);
  return switchFarm(ctx, body.farmId);
}, { mutation: true });
