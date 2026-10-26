import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/app/login/login-form";
import { BrandLockup } from "@/components/brand-logo";
import { resolvePostLoginPath } from "@/lib/platform";
import { safeNextPath } from "@/lib/safe-next";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  const next = safeNextPath((await searchParams).next);
  if (session?.user?.id) {
    const home = await resolvePostLoginPath(session.user.id);
    redirect(home === "/platform" && next?.startsWith("/platform") ? next : home);
  }
  return (
    <main className="mx-auto flex min-h-dvh w-full min-w-0 max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-6 flex justify-center" aria-label="Back to Piggery home">
        <BrandLockup tone="light" />
      </Link>
      <h1 className="text-center text-2xl font-semibold tracking-tight text-balance text-stone-950">Sign in</h1>
      <p className="mt-2 text-center text-sm text-stone-600">
        Farm accounts are created by the platform or farm owner. There is no public registration.
      </p>
      <div className="mt-8 w-full min-w-0 rounded-2xl border bg-white p-5 shadow-sm">
        <LoginForm nextPath={next} />
      </div>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href="/" className="font-medium text-primary hover:underline">
          Back to home
        </Link>
      </p>
    </main>
  );
}
