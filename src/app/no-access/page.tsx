export default function NoAccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold">No farm access</h1>
      <p className="mt-2 text-sm text-stone-600">This account is not active on a farm. Ask the farm owner to grant access.</p>
    </main>
  );
}
