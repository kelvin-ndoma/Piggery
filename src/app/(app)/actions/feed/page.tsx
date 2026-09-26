import { FeedRecordForm } from "@/components/forms/ops-forms";
import { PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { listFeedTypes } from "@/services/feed";
import { housingOptions } from "@/services/pigs";

export default async function FeedActionPage() {
  const ctx = await requireFarmContext();
  const [feeds, pens] = await Promise.all([listFeedTypes(ctx), housingOptions(ctx)]);
  return (
    <div>
      <PageHeader title="Record feed" description="Consumption is stored as its own record. Cost is quantity times the cost per kg saved at the time." />
      <div className="mx-auto max-w-xl">
        <FeedRecordForm
          feeds={feeds.filter((feed) => feed.isActive).map((feed) => ({ value: feed.id, label: feed.name, description: `${feed.quantityKg} kg on hand` }))}
          pens={pens}
          canPurchase={can(ctx.role, "finance:write")}
        />
      </div>
    </div>
  );
}
