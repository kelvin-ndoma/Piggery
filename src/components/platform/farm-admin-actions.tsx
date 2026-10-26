"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { goAfterSave } from "@/lib/client-nav";

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

export function FarmStatusControls({
  farmId,
  status,
}: {
  farmId: string;
  status: "ACTIVE" | "PAUSED" | "SUSPENDED";
}) {
  const [pending, setPending] = useState<string | null>(null);

  async function setStatus(next: (typeof STATUSES)[number]["value"]) {
    if (next === status) return;
    setPending(next);
    await fetch(`/api/platform/farms/${farmId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setPending(null);
    goAfterSave();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((item) => (
        <Button
          key={item.value}
          type="button"
          size="sm"
          variant={status === item.value ? "default" : "outline"}
          disabled={pending !== null}
          onClick={() => setStatus(item.value)}
        >
          {pending === item.value ? "Saving..." : item.label}
        </Button>
      ))}
    </div>
  );
}

export function FarmBillingForm({
  farmId,
  billing,
}: {
  farmId: string;
  billing: {
    plan: string;
    status: string;
    cycle: string;
    amount: number;
    currency: string;
    nextBillingOn: string | null;
    paidThroughOn: string | null;
    notes: string;
  };
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const res = await fetch(`/api/platform/farms/${farmId}/billing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: String(form.get("plan") ?? ""),
        status: String(form.get("status") ?? ""),
        cycle: String(form.get("cycle") ?? ""),
        amount: Number(form.get("amount") ?? 0),
        currency: String(form.get("currency") ?? "KES"),
        nextBillingOn: String(form.get("nextBillingOn") ?? ""),
        paidThroughOn: String(form.get("paidThroughOn") ?? ""),
        notes: String(form.get("notes") ?? ""),
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true }
      | { success: false; error?: { message?: string } }
      | null;
    setPending(false);
    if (!res.ok || !json || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not save billing." : "Could not save billing.");
      return;
    }
    goAfterSave();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <h2 className="text-base font-semibold">Billing (manual)</h2>
        <p className="mt-1 text-sm text-stone-600">
          Update plan and payment state by hand until automated billing is connected.
        </p>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5 text-sm font-medium">
          Plan
          <select name="plan" defaultValue={billing.plan} className="h-11 w-full rounded-xl border bg-white px-3">
            {["FREE", "STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"].map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Billing status
          <select name="status" defaultValue={billing.status} className="h-11 w-full rounded-xl border bg-white px-3">
            {["TRIAL", "CURRENT", "PAST_DUE", "PAUSED", "COMPED", "CANCELLED"].map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Cycle
          <select name="cycle" defaultValue={billing.cycle} className="h-11 w-full rounded-xl border bg-white px-3">
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Amount
          <Input name="amount" type="number" min={0} step="1" defaultValue={billing.amount} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Currency
          <Input name="currency" defaultValue={billing.currency} maxLength={3} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Next billing on
          <Input name="nextBillingOn" type="date" defaultValue={billing.nextBillingOn ?? ""} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Paid through
          <Input name="paidThroughOn" type="date" defaultValue={billing.paidThroughOn ?? ""} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium md:col-span-2">
          Notes
          <Input name="notes" defaultValue={billing.notes} maxLength={1000} placeholder="M-Pesa ref, invoice #, etc." />
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save billing"}
      </Button>
    </form>
  );
}

export function AssignOwnerForm({ farmId }: { farmId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const res = await fetch(`/api/platform/farms/${farmId}/owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        phone: String(form.get("phone") ?? ""),
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true }
      | { success: false; error?: { message?: string } }
      | null;
    setPending(false);
    if (!res.ok || !json || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not assign owner." : "Could not assign owner.");
      return;
    }
    event.currentTarget.reset();
    goAfterSave();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <h2 className="text-base font-semibold">Assign / replace owner</h2>
        <p className="mt-1 text-sm text-stone-600">
          Sets this person as OWNER. Any previous owner on this farm becomes a farm manager.
        </p>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5 text-sm font-medium">
          Name
          <Input name="name" required />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Email
          <Input name="email" type="email" required />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Temporary password
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Phone
          <Input name="phone" />
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save owner"}
      </Button>
    </form>
  );
}
