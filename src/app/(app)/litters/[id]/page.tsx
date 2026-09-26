import Link from "next/link";
import { PigletForm } from "@/components/forms/herd-forms";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";
import { getLitter } from "@/services/breeding";
import { housingOptions } from "@/services/pigs";

export default async function LitterPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireFarmContext();
  const { id } = await params;
  let litter;
  try {
    litter = await getLitter(ctx, id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const pens = await housingOptions(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={litter.litterNumber} description={`${litter.mother} · ${litter.birthDate} · ${litter.bornAlive} born alive, ${litter.stillborn} stillborn, ${litter.male} male, ${litter.female} female, ${litter.currentlyAlive} currently alive.`} />
      <RecordTable
        columns={[{ key: "pig", label: "Pig" }, { key: "sex", label: "Sex" }, { key: "weight", label: "Birth weight" }, { key: "status", label: "Status" }]}
        rows={litter.piglets.map((piglet) => ({
          id: piglet.id,
          cells: {
            pig: <Link className="text-primary" href={`/pigs/${piglet.pigId}`}>{piglet.pigId}</Link>,
            sex: piglet.sex,
            weight: piglet.birthWeightKg ? `${piglet.birthWeightKg} kg` : "—",
            status: <Badge value={piglet.status} />,
          },
        }))}
        empty={{ title: "No individual piglets registered yet." }}
      />
      {can(ctx.role, "breeding:write") ? <PigletForm litterId={litter.id} penOptions={pens} /> : null}
    </div>
  );
}
