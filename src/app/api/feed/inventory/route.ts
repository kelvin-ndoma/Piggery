import { apiHandler } from "@/lib/api";
import { inventorySummary } from "@/services/feed";

export const GET = apiHandler(async (_request, ctx) => inventorySummary(ctx), { permission: "feed:read" });
