"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { goAfterSave } from "@/lib/client-nav";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isRoot: boolean;
};

export function AdminTeamPanel({
  admins,
  canManage,
}: {
  admins: AdminRow[];
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [rowPending, setRowPending] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(true);

  async function patchAdmin(id: string, body: { role?: string; isActive?: boolean }) {
    setRowPending(id);
    setError(null);
    setOk(null);
    const res = await fetch(`/api/platform/admins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true }
      | { success: false; error?: { message?: string } }
      | null;
    setRowPending(null);
    if (!res.ok || !json || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not update admin." : "Could not update admin.");
      return false;
    }
    goAfterSave();
    return true;
  }

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    setOk(null);
    const password = String(data.get("password") ?? "");
    const email = String(data.get("email") ?? "");
    const res = await fetch("/api/platform/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(data.get("name") ?? ""),
        email,
        password,
        phone: String(data.get("phone") ?? ""),
        role: String(data.get("role") ?? "ADMIN"),
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true }
      | { success: false; error?: { message?: string } }
      | null;
    setPending(false);
    if (!res.ok || !json || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not add admin." : "Could not add admin.");
      return;
    }
    form.reset();
    setOk(`Admin added for ${email}. Temporary password: ${password}`);
    goAfterSave();
  }

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      {ok ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{ok}</p> : null}

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-stone-50 text-xs uppercase tracking-[0.08em] text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => {
              const busy = rowPending === admin.id;
              return (
                <tr key={admin.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{admin.name}</p>
                    <p className="text-xs text-stone-500">{admin.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && !admin.isRoot ? (
                      <select
                        className="h-10 min-w-[9rem] rounded-xl border bg-white px-3"
                        value={admin.role}
                        disabled={busy}
                        onChange={async (event) => {
                          const role = event.target.value;
                          if (role === admin.role) return;
                          const okUpdate = await patchAdmin(admin.id, { role });
                          if (okUpdate) setOk(`Updated ${admin.name} to ${role}.`);
                        }}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="SUPERADMIN">Superadmin</option>
                      </select>
                    ) : (
                      <span>{admin.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{admin.isActive ? "Active" : "Disabled"}</td>
                  <td className="px-4 py-3">
                    {canManage && !admin.isRoot ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={async () => {
                          const okUpdate = await patchAdmin(admin.id, { isActive: !admin.isActive });
                          if (okUpdate) {
                            setOk(
                              admin.isActive
                                ? `Disabled ${admin.name}.`
                                : `Enabled ${admin.name}.`,
                            );
                          }
                        }}
                      >
                        {busy ? "Saving..." : admin.isActive ? "Disable" : "Enable"}
                      </Button>
                    ) : (
                      <span className="text-xs text-stone-500">{admin.isRoot ? "Root" : "—"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canManage ? (
        <form onSubmit={onCreate} className="space-y-4 rounded-2xl border bg-white p-5">
          <div>
            <h2 className="text-base font-semibold">Add platform admin</h2>
            <p className="mt-1 text-sm text-stone-600">
              Change an admin’s role from the table above. Root superadmin role stays locked.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium">
              Name
              <Input name="name" required />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Email
              <Input name="email" type="email" required autoComplete="off" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Temporary password
              <span className="relative block">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </span>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Role
              <select name="role" defaultValue="ADMIN" className="h-11 w-full rounded-xl border bg-white px-3">
                <option value="ADMIN">Admin</option>
                <option value="SUPERADMIN">Superadmin</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium md:col-span-2">
              Phone
              <Input name="phone" />
            </label>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add admin"}
          </Button>
        </form>
      ) : (
        <p className="rounded-2xl border bg-white px-4 py-3 text-sm text-stone-600">
          Only the platform superadmin can add or change admin team members.
        </p>
      )}
    </div>
  );
}
