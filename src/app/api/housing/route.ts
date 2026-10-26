import { apiHandler } from "@/lib/api";
import { listHousing } from "@/services/housing";

export const GET = apiHandler(async (_request, ctx) => listHousing(ctx));
