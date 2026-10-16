"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PlatformSettingsForm({
  settings,
}: {
  settings: {
    supportEmail: string;
    supportPhone: string;
    defaultCountry: string;
    defaultCurrency: string;
    billingCurrency: string;
    invoiceNote: string;
    trialDays: number;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setOk(false);
    const res = await fetch("/api/platform/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supportEmail: String(form.get("supportEmail") ?? ""),
        supportPhone: String(form.get("supportPhone") ?? ""),
        defaultCountry: String(form.get("defaultCountry") ?? ""),
        defaultCurrency: String(form.get("defaultCurrency") ?? ""),
        billingCurrency: String(form.get("billingCurrency") ?? ""),
        invoiceNote: String(form.get("invoiceNote") ?? ""),
        trialDays: Number(form.get("trialDays") ?? 0),
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true }
      | { success: false; error?: { message?: string } }
      | null;
    setPending(false);
    if (!res.ok || !json || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not save settings." : "Could not save settings.");
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5 md:p-6">
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      {ok ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Settings saved.</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5 text-sm font-medium">
          Support email
          <Input name="supportEmail" type="email" required defaultValue={settings.supportEmail} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Support phone
          <Input name="supportPhone" defaultValue={settings.supportPhone} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Default country
          <Input name="defaultCountry" required defaultValue={settings.defaultCountry} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Default farm currency
          <Input name="defaultCurrency" required maxLength={3} defaultValue={settings.defaultCurrency} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Billing currency
          <Input name="billingCurrency" required maxLength={3} defaultValue={settings.billingCurrency} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Trial days
          <Input name="trialDays" type="number" min={0} max={365} required defaultValue={settings.trialDays} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium md:col-span-2">
          Invoice / billing note
          <Input name="invoiceNote" defaultValue={settings.invoiceNote} maxLength={1000} />
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
