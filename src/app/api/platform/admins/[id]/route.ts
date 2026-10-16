import { parsePlatformJson, platformApiHandler } from "@/lib/platform-api";
import { requireSuperAdminApi } from "@/lib/platform";
import { updatePlatformAdminSchema } from "@/schemas";
import { updatePlatformAdmin } from "@/services/platform";

export const PATCH = platformApiHandler(
  async (req, ctx, route) => {
    await requireSuperAdminApi();
    const { id } = await route.params;
    const input = await parsePlatformJson(req, updatePlatformAdminSchema);
    return updatePlatformAdmin(ctx, id, input);
  },
  { mutation: true },
);
