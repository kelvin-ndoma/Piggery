import { platformApiHandler } from "@/lib/platform-api";
import { listFarmInquiries } from "@/services/inquiries";

export const GET = platformApiHandler(async () => listFarmInquiries());
