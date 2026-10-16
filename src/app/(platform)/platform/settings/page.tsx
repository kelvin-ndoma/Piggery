import { PlatformSettingsForm } from "@/components/platform/settings-form";
import { PageHeader } from "@/components/page-header";
import { requirePlatformAdmin } from "@/lib/platform";
import { getPlatformSettings } from "@/services/platform";

export default async function PlatformSettingsPage() {
  await requirePlatformAdmin();
  const settings = await getPlatformSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Defaults for new farms, support contacts, and billing notes. Card payments can come later."
      />
      <PlatformSettingsForm settings={settings} />
    </div>
  );
}
