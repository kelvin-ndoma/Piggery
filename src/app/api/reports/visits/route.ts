import { apiHandler } from "@/lib/api";
import { maybeCsv, reportQuery } from "@/lib/report-route";
import { visitReport } from "@/services/reports";

export const GET = apiHandler(async (request, ctx) => {
  const { query, range } = reportQuery(request, ctx);
  const rows = await visitReport(ctx, range.from, range.to);
  return maybeCsv(query.format, "visits.csv", ["Visit", "Date", "Farmer", "Officer", "Housing", "Health", "Water", "Feeding", "Feed quality"], rows.map((row) => [row.visitNumber, row.date, row.farmerName, row.visitingOfficer, row.housing, row.health, row.water, row.feeding, row.feedQuality]), { range, rows });
}, { permission: "pigs:read" });
