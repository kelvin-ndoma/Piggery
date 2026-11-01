"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#f4f1ea] px-4 py-16 text-[#1c1917]">
        <main className="mx-auto max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">The app could not load. Try again.</p>
          <button
            type="button"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#1f4d3a] px-4 text-sm text-[#f6f3ec]"
            onClick={reset}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
