import { platformApiHandler } from "@/lib/platform-api";
import { listBillingFarms } from "@/services/platform";

export const GET = platformApiHandler(async () => listBillingFarms());
