import { auth } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/platform";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: true, data: { path: "/login" } });
  }
  const path = await resolvePostLoginPath(session.user.id);
  return Response.json({ success: true, data: { path } });
}
