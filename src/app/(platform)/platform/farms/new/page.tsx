import { CreateFarmForm } from "@/components/platform/create-farm-form";
import { PageHeader } from "@/components/page-header";
import { requirePlatformAdmin } from "@/lib/platform";

export default async function NewFarmTenantPage() {
  await requirePlatformAdmin();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Add farm tenant"
        description="Create an empty farm workspace and assign the farmer who will own it."
      />
      <CreateFarmForm />
    </div>
  );
}
