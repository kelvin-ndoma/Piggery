import { apiHandler, parseJson } from "@/lib/api";
import { feedTypeSchema } from "@/schemas";
import { createFeedType, listFeedTypes } from "@/services/feed";

export const GET = apiHandler(async (_request, ctx) => listFeedTypes(ctx), { permission: "feed:read" });

export const POST = apiHandler(async (request, ctx) => createFeedType(ctx, await parseJson(request, feedTypeSchema)), {
  permission: "feed:write",
  mutation: true,
});
