"use client";

import { Button } from "@/components/ui/button";

export default function PlatformError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone-600">The platform page could not be loaded.</p>
      <Button type="button" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
