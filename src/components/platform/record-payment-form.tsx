"use client";

import { useState } from "react";
import { goAfterSave } from "@/lib/client-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RecordPaymentForm({
  farmId,
  amount,
  currency,
  paidOn,
}: {
  farmId: string;
  amount: number;
  currency: string;
  paidOn: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const res = await fetch(`/api/platform/farms/${farmId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(form.get("amount") ?? 0),
        currency: String(form.get("currency") ?? currency),
        method: String(form.get("method") ?? "MPESA"),
        reference: String(form.get("reference") ?? ""),
        paidOn: String(form.get("paidOn") ?? ""),
        note: String(form.get("note") ?? ""),
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true }
      | { success: false; error?: { message?: string } }
      | null;
    setPending(false);
    if (!res.ok || !json || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not record payment." : "Could not record payment.");
      return;
    }
    goAfterSave();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <h2 className="text-base font-semibold">Record a payment</h2>
        <p className="mt-1 text-sm text-stone-600">
          Marks billing as current and sets paid-through from the paid date. Use M-Pesa, bank, or cash.
        </p>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5 text-sm font-medium">
          Amount
          <Input name="amount" type="number" min={0} step="1" defaultValue={amount} required />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Currency
          <Input name="currency" defaultValue={currency} maxLength={3} required />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Method
          <select name="method" defaultValue="MPESA" className="h-11 w-full rounded-xl border bg-white px-3">
            <option value="MPESA">M-Pesa</option>
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Reference
          <Input name="reference" maxLength={120} placeholder="M-Pesa code or receipt" />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Paid on
          <Input name="paidOn" type="date" defaultValue={paidOn} required />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Note
          <Input name="note" maxLength={1000} />
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Record payment"}
      </Button>
    </form>
  );
}
