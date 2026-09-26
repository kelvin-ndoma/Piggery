import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">{body}</p> : null}
      {action ? (
        <Button asChild className="mt-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
