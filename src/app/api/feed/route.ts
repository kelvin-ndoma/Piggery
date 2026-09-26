import { apiHandler, parseJson, parseQuery } from "@/lib/api";
import { dateRangeSchema, feedRecordSchema } from "@/schemas";
import { listFeedRecords, recordFeed } from "@/services/feed";

export const GET = apiHandler(async (request, ctx) => {
  const query = parseQuery(request, dateRangeSchema);
  return listFeedRecords(ctx, query.from || undefined, query.to || undefined);
}, { permission: "feed:read" });

export const POST = apiHandler(async (request, ctx) => recordFeed(ctx, await parseJson(request, feedRecordSchema)), {
  permission: "feed:write",
  mutation: true,
});
