import { parsePlatformJson, platformApiHandler } from "@/lib/platform-api";
import { platformSettingsSchema } from "@/schemas";
import { getPlatformSettings, updatePlatformSettings } from "@/services/platform";

export const GET = platformApiHandler(async () => getPlatformSettings());

export const PATCH = platformApiHandler(
  async (req, ctx) => {
    const input = await parsePlatformJson(req, platformSettingsSchema);
    return updatePlatformSettings(ctx, input);
  },
  { mutation: true },
);
