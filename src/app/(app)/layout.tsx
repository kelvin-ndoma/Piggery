import { AppShell } from "@/components/layout/shell";
import { NAV_ITEMS, QUICK_ACTIONS } from "@/components/layout/nav";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { countUnread } from "@/services/notifications";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireFarmContext();
  const unread = await countUnread(ctx);
  const links = NAV_ITEMS.filter((item) => !item.permission || can(ctx.role, item.permission));
  const actions = QUICK_ACTIONS.filter((item) => can(ctx.role, item.permission));
  return (
    <AppShell
      role={ctx.role}
      userName={ctx.userName}
      unread={unread}
      demo={ctx.farm.demoSeed}
      links={links}
      actions={actions}
    >
      {children}
    </AppShell>
  );
}
