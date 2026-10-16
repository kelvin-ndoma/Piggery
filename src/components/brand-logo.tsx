import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority = false,
  variant = "full",
}: {
  className?: string;
  priority?: boolean;
  variant?: "full" | "mark";
}) {
  if (variant === "mark") {
    return (
      <Image
        src="/logo.png"
        alt="Piggery"
        width={80}
        height={80}
        priority={priority}
        className={cn(
          "h-10 w-10 shrink-0 rounded-full bg-white object-cover object-[center_18%] ring-1 ring-black/5",
          className,
        )}
      />
    );
  }
  return (
    <Image
      src="/logo.png"
      alt="Piggery — Farm management solution"
      width={320}
      height={320}
      priority={priority}
      className={cn("h-auto w-full max-w-[14rem] object-contain", className)}
    />
  );
}

export function BrandLockup({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <BrandLogo variant="mark" className="h-10 w-10" />
      <span className="min-w-0 leading-tight">
        <span
          className={cn(
            "block text-base font-semibold tracking-tight",
            tone === "dark" ? "text-primary-foreground" : "text-primary",
          )}
        >
          Piggery
        </span>
        <span
          className={cn(
            "block text-[11px] font-medium uppercase tracking-[0.12em]",
            tone === "dark" ? "text-emerald-100/65" : "text-stone-500",
          )}
        >
          Farm app
        </span>
      </span>
    </span>
  );
}
