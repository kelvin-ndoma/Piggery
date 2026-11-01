import { PublicFrame } from "@/components/public-frame";

const COPY = {
  paused: {
    title: "This farm is paused",
    body: "Access is off until the platform team turns the farm back on. Ask the owner or support if you need it today.",
  },
  suspended: {
    title: "This farm is suspended",
    body: "The farm cannot be used right now. Ask the platform team about billing or access.",
  },
  none: {
    title: "No farm access",
    body: "This account is not active on a farm. Ask the farm owner to grant access, or sign in again if this session is from an older login.",
  },
} as const;

export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const reason = (await searchParams).reason;
  const copy = reason === "paused" || reason === "suspended" ? COPY[reason] : COPY.none;
  return (
    <PublicFrame>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-950">{copy.title}</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">{copy.body}</p>
      <a
        href="/api/session/reset"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm text-primary-foreground"
      >
        Sign in again
      </a>
    </PublicFrame>
  );
}
