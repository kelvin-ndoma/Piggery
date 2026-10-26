import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";
import { auth } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/platform";
import { DEFAULT_PLATFORM_SETTINGS } from "@/types/domain";

export const metadata: Metadata = {
  title: { absolute: "Piggery — Farm records for pig herds" },
  description:
    "Daily records for a pig farm: herd, pens, serving dates, litters, health, feed, and today’s counts from what the team saved.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Piggery — Farm records for pig herds",
    description:
      "Daily records for a pig farm: herd, pens, serving dates, litters, health, feed, and today’s counts.",
    images: ["/logo.png"],
  },
};

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;
  const appHref = userId ? await resolvePostLoginPath(userId) : "/login";
  const appLabel = appHref === "/platform" ? "Open platform" : userId ? "Open farm" : "Sign in";

  return (
    <LandingPage
      appHref={appHref}
      appLabel={appLabel}
      supportEmail={DEFAULT_PLATFORM_SETTINGS.supportEmail}
    />
  );
}
