import { TreatmentForm } from "@/components/forms/health-forms";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { listIncidents } from "@/services/health";
import { pigOptions } from "@/services/pigs";

export default async function TreatmentPage() {
  const ctx = await requireFarmContext();
  const [pigs, incidents] = await Promise.all([pigOptions(ctx), listIncidents(ctx)]);
  return (
    <div>
      <PageHeader title="Record treatment" />
      <TreatmentForm pigs={pigs} incidents={incidents.map((incident) => ({ value: incident.id, label: `${incident.pigId} · ${incident.date}`, description: incident.symptoms }))} />
    </div>
  );
}
