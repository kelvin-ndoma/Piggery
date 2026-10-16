import { AdminTeamPanel } from "@/components/platform/admin-team";
import { PageHeader } from "@/components/page-header";
import { requirePlatformAdmin } from "@/lib/platform";
import { listPlatformAdmins } from "@/services/platform";

export default async function PlatformAdminsPage() {
  const ctx = await requirePlatformAdmin();
  const admins = await listPlatformAdmins();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Admin team"
        description="People who can operate the platform. Farm owners stay on their own farm workspace."
      />
      <AdminTeamPanel admins={admins} canManage={ctx.isSuperAdmin} />
    </div>
  );
}
