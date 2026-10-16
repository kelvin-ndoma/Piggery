import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/platform";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  redirect(await resolvePostLoginPath(session.user.id));
}
