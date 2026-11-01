import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";
import { auth } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/platform";
import { publicSupportEmail } from "@/lib/public-contact";
import { getPlatformSettings } from "@/services/platform";

export const metadata: Metadata = {
  title: { absolute: "Piggery — Farm software for pig herds" },
  description:
    "A workspace for pig farms in Kenya. Record the herd, serving, health, feed, and housing. Today’s numbers come from what the team saved.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Piggery — Farm software for pig herds",
    description:
      "One workspace for the herd, the team, and the day. Built for pig farms in Kenya.",
    url: "/",
    siteName: "Piggery",
    locale: "en_KE",
    type: "website",
    images: ["/logo.png"],
  },
};

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) {
    redirect(await resolvePostLoginPath(session.user.id));
  }

  return <LandingPage supportEmail={await landingSupportEmail()} />;
}

async function landingSupportEmail(): Promise<string | null> {
  try {
    return publicSupportEmail((await getPlatformSettings()).supportEmail);
  } catch {
    return null;
  }
}
