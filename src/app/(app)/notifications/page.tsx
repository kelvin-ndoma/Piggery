import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { listNotifications } from "@/services/notifications";
import { MarkRead } from "@/app/(app)/notifications/mark-read";

export default async function NotificationsPage() {
  const ctx = await requireFarmContext();
  const items = await listNotifications(ctx);
  return (
    <div>
      <PageHeader title="Alerts" description="Due vaccinations, expected farrowings, low feed, and visit tasks." />
      {items.length === 0 ? <p className="text-sm text-stone-600">No alerts yet. They appear when farm events are recorded.</p> : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border bg-white p-4">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-stone-600">{item.body}</p>
              <MarkRead id={item.id} href={item.href} read={item.read} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
