import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/app/login/login-form";
import { BrandLogo } from "@/components/brand-logo";
import { resolvePostLoginPath } from "@/lib/platform";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect(await resolvePostLoginPath(session.user.id));
  return (
    <main className="mx-auto flex min-h-dvh w-full min-w-0 max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 flex justify-center">
        <BrandLogo priority className="max-w-[11rem] sm:max-w-[13rem]" />
      </div>
      <h1 className="text-center text-3xl font-semibold tracking-tight text-balance">Sign in</h1>
      <p className="mt-2 text-center text-sm text-stone-600">
        Farm accounts are created by the platform or farm owner. There is no public registration.
      </p>
      <div className="mt-8 w-full min-w-0 rounded-2xl border bg-white p-5 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}
