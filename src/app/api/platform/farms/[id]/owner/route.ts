import { parsePlatformJson, platformApiHandler } from "@/lib/platform-api";
import { assignFarmOwnerSchema } from "@/schemas";
import { assignFarmOwner } from "@/services/platform";

export const POST = platformApiHandler(
  async (req, ctx, route) => {
    const { id } = await route.params;
    const input = await parsePlatformJson(req, assignFarmOwnerSchema);
    return assignFarmOwner(ctx, id, input);
  },
  { mutation: true },
);
