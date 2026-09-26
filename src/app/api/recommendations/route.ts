import { apiHandler } from "@/lib/api";
import { openRecommendations } from "@/services/visits";

export const GET = apiHandler(async (_request, ctx) => openRecommendations(ctx), { permission: "pigs:read" });
