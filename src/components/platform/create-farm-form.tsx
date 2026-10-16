"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateFarmForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const body = {
      farmName: String(form.get("farmName") ?? ""),
      country: String(form.get("country") ?? "Kenya"),
      phone: String(form.get("phone") ?? ""),
      locationNote: String(form.get("locationNote") ?? ""),
      ownerName: String(form.get("ownerName") ?? ""),
      ownerEmail: String(form.get("ownerEmail") ?? ""),
      ownerPassword: String(form.get("ownerPassword") ?? ""),
      ownerPhone: String(form.get("ownerPhone") ?? ""),
    };
    const res = await fetch("/api/platform/farms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true; data: { farmId: string } }
      | { success: false; error?: { message?: string } }
      | null;
    setPending(false);
    if (!res.ok || !json || !("success" in json) || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not create farm." : "Could not create farm.");
      return;
    }
    router.push(`/platform/farms/${json.data.farmId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border bg-white p-5 md:p-6">
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-stone-900">Farm tenant</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium md:col-span-2">
            Farm name
            <Input name="farmName" required maxLength={160} placeholder="e.g. Anthony Pig Farm" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Country
            <Input name="country" defaultValue="Kenya" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Farm phone
            <Input name="phone" placeholder="+2547..." />
          </label>
          <label className="block space-y-1.5 text-sm font-medium md:col-span-2">
            Location note
            <Input name="locationNote" maxLength={300} placeholder="Optional" />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-stone-900">Owner (farmer) login</legend>
        <p className="text-sm text-stone-600">
          This person signs into the farm app as owner and manages their own team.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium">
            Owner name
            <Input name="ownerName" required maxLength={120} />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Owner email
            <Input name="ownerEmail" type="email" required autoComplete="off" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Temporary password
            <Input name="ownerPassword" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Owner phone
            <Input name="ownerPhone" placeholder="+2547..." />
          </label>
        </div>
      </fieldset>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Creating..." : "Create farm tenant"}
      </Button>
    </form>
  );
}
