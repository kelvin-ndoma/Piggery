import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MortalityForm } from "@/components/forms/health-forms";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { listIncidents } from "@/services/health";
import { pigOptions } from "@/services/pigs";

export default async function HealthPage() {
  const ctx = await requireFarmContext();
  const [incidents, pigs] = await Promise.all([listIncidents(ctx), pigOptions(ctx, { status: "ACTIVE" })]);
  return (
    <div className="space-y-8">
      <PageHeader title="Health" description="Incidents, treatments, and mortality stay on the record." action={can(ctx.role, "health:write") ? { href: "/actions/health", label: "Health incident" } : undefined} />
      <RecordTable
        columns={[{ key: "date", label: "Date" }, { key: "pig", label: "Pig" }, { key: "severity", label: "Severity" }, { key: "status", label: "Status" }, { key: "symptoms", label: "Observed" }]}
        rows={incidents.map((incident) => ({
          id: incident.id,
          cells: {
            date: formatDisplayDate(incident.date),
            pig: <Link className="text-primary" href={`/pigs/${incident.pigId}?tab=health`}>{incident.pigId}</Link>,
            severity: <Badge value={incident.severity} />,
            status: <Badge value={incident.status} />,
            symptoms: incident.symptoms,
          },
        }))}
        empty={{ title: "No health incidents yet.", action: can(ctx.role, "health:write") ? { href: "/actions/health", label: "Record an incident" } : undefined }}
      />
      {can(ctx.role, "health:write") ? <MortalityForm pigs={pigs} /> : null}
    </div>
  );
}
