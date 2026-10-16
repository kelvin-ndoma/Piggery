import { parsePlatformJson, platformApiHandler } from "@/lib/platform-api";
import { requireSuperAdminApi } from "@/lib/platform";
import { createPlatformAdminSchema } from "@/schemas";
import { createPlatformAdmin, listPlatformAdmins } from "@/services/platform";

export const GET = platformApiHandler(async () => listPlatformAdmins());

export const POST = platformApiHandler(
  async (req, ctx) => {
    await requireSuperAdminApi();
    const input = await parsePlatformJson(req, createPlatformAdminSchema);
    return createPlatformAdmin(ctx, input);
  },
  { mutation: true },
);
