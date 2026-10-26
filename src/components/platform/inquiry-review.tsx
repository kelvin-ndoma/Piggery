"use client";

import { useState } from "react";
import { catalogAmount } from "@/lib/billing-catalog";
import { goAfterSave } from "@/lib/client-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BillingCycle, BillingPlan } from "@/types/domain";

export function AcceptInquiryForm({
  inquiryId,
  plan,
  cycle,
}: {
  inquiryId: string;
  plan: BillingPlan;
  cycle: BillingCycle;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const res = await fetch(`/api/platform/inquiries/${inquiryId}?action=accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerPassword: String(form.get("ownerPassword") ?? ""),
        plan: String(form.get("plan") ?? plan),
        cycle: String(form.get("cycle") ?? cycle),
        amount: Number(form.get("amount") ?? 0),
        status: String(form.get("status") ?? "TRIAL"),
        notes: String(form.get("notes") ?? ""),
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true; data: { farmId: string } }
      | { success: false; error?: { message?: string } }
      | null;
    setPending(false);
    if (!res.ok || !json || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not accept this inquiry." : "Could not accept this inquiry.");
      return;
    }
    goAfterSave(`/platform/farms/${json.data.farmId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm md:p-6">
      <div>
        <h2 className="text-base font-semibold">Accept and create the farm</h2>
        <p className="mt-1 text-sm text-stone-600">
          Creates the farm tenant, sets billing, and gives the inquirer an owner login. Send them this temporary
          password yourself.
        </p>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
          Temporary owner password
          <Input name="ownerPassword" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Plan
          <select name="plan" defaultValue={plan} className="h-11 w-full rounded-xl border bg-white px-3">
            {["FREE", "STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Cycle
          <select name="cycle" defaultValue={cycle} className="h-11 w-full rounded-xl border bg-white px-3">
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Amount (KES)
          <Input name="amount" type="number" min={0} step="1" defaultValue={catalogAmount(plan, cycle)} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Billing status
          <select name="status" defaultValue="TRIAL" className="h-11 w-full rounded-xl border bg-white px-3">
            <option value="TRIAL">Trial</option>
            <option value="CURRENT">Current</option>
            <option value="COMPED">Comped</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
          Notes
          <Input name="notes" maxLength={1000} placeholder="Optional. Shown on the farm billing record." />
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Accept inquiry"}
      </Button>
    </form>
  );
}

export function DeclineInquiryForm({ inquiryId }: { inquiryId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const res = await fetch(`/api/platform/inquiries/${inquiryId}?action=decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewNote: String(form.get("reviewNote") ?? "") }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true }
      | { success: false; error?: { message?: string } }
      | null;
    setPending(false);
    if (!res.ok || !json || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not decline this inquiry." : "Could not decline this inquiry.");
      return;
    }
    goAfterSave("/platform/inquiries");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm md:p-6">
      <h2 className="text-base font-semibold">Decline</h2>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <label className="block space-y-1.5 text-sm font-medium">
        Reason
        <Textarea name="reviewNote" required minLength={2} maxLength={1000} />
      </label>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving..." : "Decline inquiry"}
      </Button>
    </form>
  );
}
