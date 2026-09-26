import { notFound } from "next/navigation";
import { UserForm } from "@/components/forms/ops-forms";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { labelize } from "@/lib/utils";
import { listTeam } from "@/services/team";

export default async function TeamPage() {
  const ctx = await requireFarmContext();
  if (!can(ctx.role, "users:manage")) notFound();
  const team = await listTeam(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title="Team" description="Roles are stored on the farm membership and checked on the server." />
      <RecordTable
        columns={[{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }, { key: "status", label: "Status" }]}
        rows={team.map((user) => ({ id: user.id, cells: { name: user.name, email: user.email, role: labelize(user.role), status: user.isActive ? "Active" : "Disabled" } }))}
        empty={{ title: "No team members yet." }}
      />
      <div className="max-w-xl"><UserForm /></div>
    </div>
  );
}
