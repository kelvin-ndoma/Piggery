import { LitterForm } from "@/components/forms/herd-forms";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { listBreeding } from "@/services/breeding";
import { pigOptions } from "@/services/pigs";

export default async function BirthPage({ searchParams }: { searchParams: Promise<{ sow?: string }> }) {
  const ctx = await requireFarmContext();
  const query = await searchParams;
  const [sows, boars, breeding] = await Promise.all([
    pigOptions(ctx, { sex: "FEMALE" }),
    pigOptions(ctx, { sex: "MALE" }),
    listBreeding(ctx),
  ]);
  return (
    <div>
      <PageHeader title="Record birth" description="Male and female counts must add up to the number born alive." />
      <LitterForm
        sows={sows}
        boars={boars}
        breeding={breeding.filter((item) => item.status !== "FARROWED").map((item) => ({ value: item.id, label: `${item.sow} · served ${item.breedingDate}`, description: item.status }))}
        presetMotherId={query.sow}
      />
    </div>
  );
}
