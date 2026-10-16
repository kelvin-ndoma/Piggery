import { parsePlatformJson, platformApiHandler } from "@/lib/platform-api";
import { farmStatusSchema } from "@/schemas";
import { setFarmStatus } from "@/services/platform";

export const PATCH = platformApiHandler(
  async (req, ctx, route) => {
    const { id } = await route.params;
    const input = await parsePlatformJson(req, farmStatusSchema);
    return setFarmStatus(ctx, id, input.status);
  },
  { mutation: true },
);
