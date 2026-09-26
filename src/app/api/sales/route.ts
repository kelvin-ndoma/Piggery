import { apiHandler, parseJson, parseQuery } from "@/lib/api";
import { dateRangeSchema, saleSchema } from "@/schemas";
import { listSales, recordSale } from "@/services/finance";

export const GET = apiHandler(async (request, ctx) => {
  const query = parseQuery(request, dateRangeSchema);
  return listSales(ctx, query.from || undefined, query.to || undefined);
}, { permission: "finance:read" });

export const POST = apiHandler(async (request, ctx) => recordSale(ctx, await parseJson(request, saleSchema)), {
  permission: "finance:write",
  mutation: true,
});
