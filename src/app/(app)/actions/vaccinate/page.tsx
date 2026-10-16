import { VaccinationAction, VaccineForm } from "@/components/forms/health-forms";
import { PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { listVaccines } from "@/services/health";
import { pigOptions } from "@/services/pigs";

export default async function VaccinatePage({ searchParams }: { searchParams: Promise<{ pig?: string }> }) {
  const ctx = await requireFarmContext();
  const query = await searchParams;
  const [pigs, vaccines] = await Promise.all([
    pigOptions(ctx),
    listVaccines(ctx),
  ]);
  const options = vaccines.filter((vaccine) => vaccine.isActive).map((vaccine) => ({ value: vaccine.id, label: vaccine.name, description: vaccine.manufacturer }));
  return (
    <div className="space-y-6">
      <PageHeader title="Vaccinate" description="The vaccine list is yours to maintain. Nothing here assumes a schedule." />
      {options.length === 0 ? <p className="text-sm text-stone-600">Add a vaccine product before recording a dose.</p> : <VaccinationAction pigs={pigs} vaccines={options} preset={query.pig} />}
      {can(ctx.role, "health:write") ? <VaccineForm /> : null}
    </div>
  );
}
