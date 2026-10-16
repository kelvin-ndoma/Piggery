import { notFound } from "next/navigation";
import { UserForm } from "@/components/forms/ops-forms";
import { RemoveTeamMemberButton } from "@/components/forms/team-actions";
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
      <PageHeader
        title="Team"
        description="Only the farm owner can add or remove people. Roles are checked on the server for every action."
      />
      <RecordTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions" },
        ]}
        rows={team.map((user) => ({
          id: user.id,
          cells: {
            name: user.name,
            email: user.email,
            role: labelize(user.role),
            status: user.isActive && user.status === "ACTIVE" ? "Active" : "Removed",
            actions:
              user.role !== "OWNER" && user.isActive && user.status === "ACTIVE" ? (
                <RemoveTeamMemberButton userId={user.id} name={user.name} />
              ) : (
                "—"
              ),
          },
        }))}
        empty={{ title: "No team members yet." }}
      />
      <UserForm />
    </div>
  );
}
