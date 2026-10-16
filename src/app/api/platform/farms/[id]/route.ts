import { platformApiHandler } from "@/lib/platform-api";
import { getPlatformFarm } from "@/services/platform";

export const GET = platformApiHandler(async (_req, _ctx, route) => {
  const { id } = await route.params;
  return getPlatformFarm(id);
});
