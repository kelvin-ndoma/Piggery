"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone-600">The farm data could not be loaded. Please try again.</p>
      <button type="button" className="mt-4 h-11 rounded-xl bg-primary px-4 text-sm text-primary-foreground" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
