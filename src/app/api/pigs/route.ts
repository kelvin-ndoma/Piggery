import { apiHandler, parseJson, parseQuery } from "@/lib/api";
import { createPigSchema, pigQuerySchema } from "@/schemas";
import { createPig, listPigs } from "@/services/pigs";

export const GET = apiHandler(async (request, ctx) => listPigs(ctx, parseQuery(request, pigQuerySchema)), {
  permission: "pigs:read",
});

export const POST = apiHandler(async (request, ctx) => createPig(ctx, await parseJson(request, createPigSchema)), {
  permission: "pigs:write",
  mutation: true,
});
