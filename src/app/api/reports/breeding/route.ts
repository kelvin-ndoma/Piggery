import { apiHandler } from "@/lib/api";
import { reportQuery } from "@/lib/report-route";
import { csvResponse, toCsv } from "@/lib/csv";
import { assertPermission } from "@/lib/permissions";
import { breedingReport } from "@/services/reports";

export const GET = apiHandler(async (request, ctx) => {
  const { query, range } = reportQuery(request, ctx);
  const data = await breedingReport(ctx, range.from, range.to);
  if (query.format === "csv") {
    assertPermission(ctx.role, "reports:export");
    return csvResponse("breeding.csv", toCsv(["Litter", "Birth date", "Born alive", "Stillborn", "Male", "Female", "Currently alive"], data.litters.map((row) => [row.litterNumber, row.birthDate, row.bornAlive, row.stillborn, row.male, row.female, row.currentlyAlive])));
  }
  return { range, ...data };
}, { permission: "pigs:read" });
