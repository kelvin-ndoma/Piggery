import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">{description}</p> : null}
      </div>
      {action ? (
        <Button asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
