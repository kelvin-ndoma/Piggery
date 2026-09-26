"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import type { ZodType } from "zod";
import type { ApiResponse } from "@/types/api";

export function useRecordForm<T extends FieldValues>(options: {
  url: string;
  method?: "POST" | "PATCH";
  schema: ZodType<T>;
  defaultValues: DefaultValues<T>;
  successMessage: string;
  successHref?: string;
}) {
  const router = useRouter();
  const form = useForm<T>({ defaultValues: options.defaultValues });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [transactionId, setTransactionId] = useState(() => crypto.randomUUID());

  async function submit(values: T) {
    const parsed = options.schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(options.url, {
        method: options.method ?? "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(parsed.data as object), clientTransactionId: transactionId }),
      });
      const payload = (await response.json()) as ApiResponse<{ id?: string; pigId?: string }>;
      if (!payload.success) {
        setError(payload.error.message);
        setPending(false);
        return;
      }
      toast.success(options.successMessage);
      setTransactionId(crypto.randomUUID());
      setPending(false);
      router.refresh();
      if (options.successHref) {
        const href = options.successHref.includes("{pigId}") && payload.data.pigId
          ? options.successHref.replace("{pigId}", payload.data.pigId)
          : options.successHref;
        router.push(href);
      }
    } catch {
      setError("Could not reach the server. Retrying will reuse the same transaction and will not create a duplicate.");
      setPending(false);
    }
  }

  return { form, error, pending, onSubmit: form.handleSubmit(submit) };
}
