import { apiHandler, parseJson } from "@/lib/api";
import { changePasswordSchema } from "@/schemas";
import { changePassword } from "@/services/team";

export const PATCH = apiHandler(async (request, ctx) => {
  const input = await parseJson(request, changePasswordSchema);
  return changePassword(ctx, {
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
  });
}, { mutation: true });
