"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FormCard, FormError, TextInput } from "@/components/forms/fields";
import { useRecordForm } from "@/components/forms/use-record-form";
import { changePasswordSchema } from "@/schemas";

export function ChangePasswordForm() {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/profile/password",
    method: "PATCH",
    schema: changePasswordSchema,
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    successMessage: "Password updated",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Change password">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextInput
              label="Current password"
              type="password"
              placeholder="Enter your current password"
              registration={form.register("currentPassword")}
              error={form.formState.errors.currentPassword}
            />
          </div>
          <TextInput
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            registration={form.register("newPassword")}
            error={form.formState.errors.newPassword}
          />
          <TextInput
            label="Confirm new password"
            type="password"
            placeholder="Repeat the new password"
            registration={form.register("confirmPassword")}
            error={form.formState.errors.confirmPassword}
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
          {pending ? "Saving..." : "Update password"}
        </Button>
      </FormCard>
    </form>
  );
}

export function SignOutButton() {
  return (
    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => signOut({ callbackUrl: "/login" })}>
      Sign out
    </Button>
  );
}
