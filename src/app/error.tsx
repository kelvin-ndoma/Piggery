"use client";

import { Button } from "@/components/ui/button";
import { PublicFrame } from "@/components/public-frame";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <PublicFrame>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-950">Something went wrong</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">Please try again. If this continues, come back in a few minutes.</p>
      <Button type="button" className="mt-6 w-full sm:w-auto" onClick={reset}>
        Try again
      </Button>
    </PublicFrame>
  );
}
