import { parsePlatformJson, platformApiHandler } from "@/lib/platform-api";
import { createFarmTenantSchema } from "@/schemas";
import { createFarmTenant, listPlatformFarms } from "@/services/platform";

export const GET = platformApiHandler(async () => listPlatformFarms());

export const POST = platformApiHandler(
  async (req, ctx) => {
    const input = await parsePlatformJson(req, createFarmTenantSchema);
    return createFarmTenant(ctx, input);
  },
  { mutation: true },
);
