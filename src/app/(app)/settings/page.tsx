import { SettingsForm } from "@/components/forms/ops-forms";
import { PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { isCloudinaryConfigured } from "@/lib/uploads";

export default async function SettingsPage() {
  const ctx = await requireFarmContext();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Dates use the farm timezone. Currency defaults to KES and weight to kilograms." />
      {can(ctx.role, "farm:manage") ? (
        <SettingsForm values={{
          name: ctx.farm.name,
          locationNote: ctx.farm.locationNote ?? "",
          phone: ctx.farm.phone ?? "",
          timezone: ctx.farm.settings.timezone,
          currency: ctx.farm.settings.currency,
          gestationDays: ctx.farm.settings.gestationDays,
          farrowingHorizonDays: ctx.farm.settings.farrowingHorizonDays,
          maxWeightKg: ctx.farm.settings.maxWeightKg,
          maxDailyGainKg: ctx.farm.settings.maxDailyGainKg,
        }} />
      ) : (
        <p className="text-sm text-stone-600">{ctx.farm.name} · {ctx.farm.settings.timezone} · {ctx.farm.settings.currency}</p>
      )}
      <section className="max-w-xl rounded-2xl border bg-white p-4 text-sm text-stone-600">
        <h2 className="font-medium text-stone-900">Photos and offline</h2>
        <p className="mt-2">{isCloudinaryConfigured() ? "Cloudinary is configured for pig photos." : "Photo upload is ready when Cloudinary credentials are added. QR codes still contain only the pig ID."}</p>
        <p className="mt-2">Each save carries a transaction id, so a retry after a lost connection does not create a duplicate record. A later offline queue can use the same API.</p>
      </section>
    </div>
  );
}
