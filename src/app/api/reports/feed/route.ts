import { apiHandler } from "@/lib/api";
import { maybeCsv, reportQuery } from "@/lib/report-route";
import { feedReport } from "@/services/reports";

export const GET = apiHandler(async (request, ctx) => {
  const { query, range } = reportQuery(request, ctx);
  const rows = await feedReport(ctx, range.from, range.to);
  return maybeCsv(ctx, query.format, "feed.csv", ["Date", "Feed", "Kind", "Quantity kg", "Cost"], rows.map((row) => [row.date, row.feed, row.kind, row.quantityKg, row.totalCost]), { range, rows });
}, { permission: "feed:read" });
