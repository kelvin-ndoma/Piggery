import { ChangePasswordForm, SignOutButton } from "@/components/forms/profile-form";
import { PageHeader } from "@/components/page-header";
import { requireFarmContext } from "@/lib/context";
import { labelize } from "@/lib/utils";
import { getProfile } from "@/services/team";

export default async function ProfilePage() {
  const ctx = await requireFarmContext();
  const profile = await getProfile(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account password and sign out of the farm app." />
      <section className="rounded-2xl border bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-stone-500">Name</dt>
            <dd className="mt-1 font-medium">{profile.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Email</dt>
            <dd className="mt-1 break-all font-medium">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Role</dt>
            <dd className="mt-1 font-medium">{labelize(profile.role)}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Farm</dt>
            <dd className="mt-1 font-medium">{profile.farmName}</dd>
          </div>
          {profile.phone ? (
            <div>
              <dt className="text-xs text-stone-500">Phone</dt>
              <dd className="mt-1 font-medium">{profile.phone}</dd>
            </div>
          ) : null}
        </dl>
      </section>
      <ChangePasswordForm />
      <section className="rounded-2xl border bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold">Session</h2>
        <p className="mt-2 text-sm text-stone-600">Sign out on this device when you are finished. You can sign back in with your email and password.</p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
