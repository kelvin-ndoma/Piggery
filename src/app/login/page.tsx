import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return (
    <main className="mx-auto flex min-h-dvh w-full min-w-0 max-w-md flex-col justify-center px-4 py-12">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">Piggery</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">Sign in to the farm</h1>
      <p className="mt-2 text-sm text-stone-600">Accounts are created by the farm owner. There is no public registration.</p>
      <div className="mt-8 w-full min-w-0 rounded-2xl border bg-white p-5 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}
