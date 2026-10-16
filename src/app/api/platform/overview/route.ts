import { platformApiHandler } from "@/lib/platform-api";
import { getPlatformOverview } from "@/services/platform";

export const GET = platformApiHandler(async () => getPlatformOverview());
