import { apiHandler, parseJson, parseQuery } from "@/lib/api";
import { dateRangeSchema, expenseSchema } from "@/schemas";
import { listExpenses, recordExpense } from "@/services/finance";

export const GET = apiHandler(async (request, ctx) => {
  const query = parseQuery(request, dateRangeSchema);
  return listExpenses(ctx, query.from || undefined, query.to || undefined);
}, { permission: "finance:read" });

export const POST = apiHandler(async (request, ctx) => recordExpense(ctx, await parseJson(request, expenseSchema)), {
  permission: "finance:write",
  mutation: true,
});
