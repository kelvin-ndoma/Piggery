"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/forms/fields";
import { Input } from "@/components/ui/input";
import { useRecordForm } from "@/components/forms/use-record-form";
import { penPurpose } from "@/lib/utils";
import { buildingSchema, penSchema } from "@/schemas";
import { PEN_TYPES } from "@/types/domain";
import type { SelectOption } from "@/types/api";

export function AddBlockForm({ onSuccess }: { onSuccess?: () => void | Promise<void> }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/buildings",
    schema: buildingSchema,
    defaultValues: { name: "" },
    successMessage: "Block added",
    onSuccess,
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FormError message={error} />
      <div className="flex gap-2">
        <Input placeholder="Block name, e.g. A" autoComplete="off" {...form.register("name")} />
        <Button type="submit" className="shrink-0 px-5" disabled={pending}>
          {pending ? "Adding..." : "Add block"}
        </Button>
      </div>
      {form.formState.errors.name?.message ? (
        <p className="text-sm text-rose-700">{form.formState.errors.name.message}</p>
      ) : null}
    </form>
  );
}

export function AddPenForm({
  blocks,
  sows,
  onSuccess,
}: {
  blocks: string[];
  sows: SelectOption[];
  onSuccess?: () => void | Promise<void>;
}) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/pens",
    schema: penSchema,
    defaultValues: { block: blocks[0] ?? "", code: "", type: "MIXED", groupBornOn: "", motherId: "" },
    successMessage: "Pen added",
    onSuccess,
  });
  const type = form.watch("type");

  if (blocks.length === 0) {
    return <p className="text-sm text-stone-500">Add a block first, then give it a pen number.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FormError message={error} />
      <div className="flex flex-wrap gap-2">
        <select
          className="h-11 min-w-[7rem] flex-1 rounded-xl border border-input bg-white px-3 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...form.register("block")}
        >
          {blocks.map((block) => (
            <option key={block} value={block}>
              {block}
            </option>
          ))}
        </select>
        <Input
          className="w-28 flex-none"
          placeholder="Number"
          autoComplete="off"
          {...form.register("code")}
        />
        <select
          className="h-11 min-w-[8rem] flex-1 rounded-xl border border-input bg-white px-3 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...form.register("type")}
        >
          {PEN_TYPES.map((type) => (
            <option key={type} value={type}>
              {penPurpose(type)}
            </option>
          ))}
        </select>
        <Button type="submit" className="shrink-0 px-5" disabled={pending}>
          {pending ? "Adding..." : "Add pen"}
        </Button>
      </div>
      {type === "GROWER" ? (
        <div className="flex flex-wrap gap-2">
          <Input type="date" className="flex-1" title="Born on" {...form.register("groupBornOn")} />
          <select
            className="h-11 min-w-[8rem] flex-1 rounded-xl border border-input bg-white px-3 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register("motherId")}
          >
            <option value="">Mother</option>
            {sows.map((sow) => (
              <option key={sow.value} value={sow.value}>
                {sow.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {form.formState.errors.code?.message ? (
        <p className="text-sm text-rose-700">{form.formState.errors.code.message}</p>
      ) : null}
    </form>
  );
}

export function GrowerBatchForm({
  penId,
  groupBornOn,
  motherId,
  sows,
  onSuccess,
}: {
  penId: string;
  groupBornOn: string;
  motherId: string;
  sows: SelectOption[];
  onSuccess?: () => void | Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const response = await fetch(`/api/pens/${penId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupBornOn: String(form.get("groupBornOn") ?? ""),
        motherId: String(form.get("motherId") ?? ""),
      }),
    });
    const payload = (await response.json()) as { success: boolean; error?: { message: string } };
    setPending(false);
    if (!payload.success) {
      setError(payload.error?.message ?? "Could not save.");
      return;
    }
    await onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 text-left">
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
      <input
        name="groupBornOn"
        type="date"
        defaultValue={groupBornOn}
        className="h-9 w-full rounded-lg border bg-white px-2 text-xs"
        aria-label="Born on"
      />
      <select
        name="motherId"
        defaultValue={motherId}
        className="h-9 w-full rounded-lg border bg-white px-2 text-xs"
        aria-label="Mother"
      >
        <option value="">Mother not recorded</option>
        {sows.map((sow) => (
          <option key={sow.value} value={sow.value}>
            {sow.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Save age / mother"}
      </Button>
    </form>
  );
}
