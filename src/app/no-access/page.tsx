export default function NoAccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold">No farm access</h1>
      <p className="mt-2 text-sm text-stone-600">This account is not active on a farm. Ask the farm owner to grant access, or sign in again if this session is from an older login.</p>
      <a href="/api/session/reset" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm text-primary-foreground">Sign in again</a>
    </main>
  );
}
