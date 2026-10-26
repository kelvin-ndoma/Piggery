"use client";

import { useState } from "react";
import { BILLING_PLAN_CATALOG } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fieldClass = "block space-y-1.5 text-sm font-medium text-stone-800";

export function InquiryForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        farmName: String(form.get("farmName") ?? ""),
        country: String(form.get("country") ?? "Kenya"),
        locationNote: String(form.get("locationNote") ?? ""),
        herdNote: String(form.get("herdNote") ?? ""),
        plan: String(form.get("plan") ?? "STARTER"),
        cycle: String(form.get("cycle") ?? "MONTHLY"),
        message: String(form.get("message") ?? ""),
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success: true }
      | { success: false; error?: { message?: string } }
      | null;
    setPending(false);
    if (!res.ok || !json || !json.success) {
      setError(json && "error" in json ? json.error?.message ?? "Could not send the inquiry." : "Could not send the inquiry.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-[1.6rem] bg-white p-6 text-stone-900 shadow-xl sm:p-8">
        <h3 className="text-xl font-semibold">Inquiry sent</h3>
        <p className="mt-2 text-sm leading-7 text-stone-600">
          The platform team will review it. If the farm is accepted, the owner email in the inquiry receives a login.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[1.6rem] bg-white p-5 text-stone-900 shadow-xl sm:p-8">
      {error ? <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={fieldClass}>
          Your name
          <Input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label className={fieldClass}>
          Email
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className={fieldClass}>
          Phone
          <Input name="phone" placeholder="+2547..." />
        </label>
        <label className={fieldClass}>
          Farm name
          <Input name="farmName" required maxLength={160} />
        </label>
        <label className={fieldClass}>
          Country
          <Input name="country" defaultValue="Kenya" />
        </label>
        <label className={fieldClass}>
          Location
          <Input name="locationNote" maxLength={300} placeholder="Optional" />
        </label>
        <label className={`${fieldClass} sm:col-span-2`}>
          Herd note
          <Input name="herdNote" maxLength={300} placeholder="Optional. e.g. 40 growers, 6 sows" />
        </label>
        <label className={fieldClass}>
          Plan
          <select name="plan" defaultValue="STARTER" className="h-11 w-full rounded-xl border border-input bg-white px-3">
            {BILLING_PLAN_CATALOG.map((plan) => (
              <option key={plan.plan} value={plan.plan}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          Billing cycle
          <select name="cycle" defaultValue="MONTHLY" className="h-11 w-full rounded-xl border border-input bg-white px-3">
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </label>
        <label className={`${fieldClass} sm:col-span-2`}>
          Message
          <Textarea name="message" maxLength={2000} placeholder="Optional. Anything we should know." />
        </label>
      </div>
      <Button type="submit" disabled={pending} className="mt-5 w-full sm:w-auto">
        {pending ? "Sending..." : "Send inquiry"}
      </Button>
    </form>
  );
}
