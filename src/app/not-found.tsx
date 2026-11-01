import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicFrame } from "@/components/public-frame";

export default function NotFound() {
  return (
    <PublicFrame>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-950">Page not found</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">That address is not in Piggery.</p>
      <Button asChild className="mt-6 w-full sm:w-auto">
        <Link href="/">Back to home</Link>
      </Button>
    </PublicFrame>
  );
}
