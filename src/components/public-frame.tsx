import Link from "next/link";
import { BrandLockup } from "@/components/brand-logo";

export function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full min-w-0 max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-6 flex justify-center" aria-label="Piggery home">
        <BrandLockup tone="light" />
      </Link>
      {children}
    </main>
  );
}
