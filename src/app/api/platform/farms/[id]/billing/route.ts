import { parsePlatformJson, platformApiHandler } from "@/lib/platform-api";
import { farmBillingSchema } from "@/schemas";
import { updateFarmBilling } from "@/services/platform";

export const PATCH = platformApiHandler(
  async (req, ctx, route) => {
    const { id } = await route.params;
    const input = await parsePlatformJson(req, farmBillingSchema);
    return updateFarmBilling(ctx, id, input);
  },
  { mutation: true },
);
