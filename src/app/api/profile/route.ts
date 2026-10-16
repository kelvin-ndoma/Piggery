import { apiHandler } from "@/lib/api";
import { getProfile } from "@/services/team";

export const GET = apiHandler(async (_request, ctx) => getProfile(ctx));
