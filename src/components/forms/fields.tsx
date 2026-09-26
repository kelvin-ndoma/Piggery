"use client";

import { useMemo, useState } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SelectOption } from "@/types/api";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: FieldError | string;
  hint?: string;
  children: ReactNode;
}) {
  const message = typeof error === "string" ? error : error?.message;
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-stone-800">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-stone-500">{hint}</span> : null}
      {message ? <span className="block text-sm text-rose-700">{message}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  registration,
  options,
  placeholder = "Choose",
  error,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: FieldError;
}) {
  return (
    <Field label={label} error={error}>
      <select
        {...registration}
        className="h-11 w-full rounded-xl border border-input bg-white px-3 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function NativeSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-11 w-full rounded-xl border border-input bg-white px-3 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
        props.className,
      )}
    />
  );
}

export function SearchSelect({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options.slice(0, 30);
    return options
      .filter((option) => `${option.label} ${option.keywords ?? ""} ${option.description ?? ""}`.toLowerCase().includes(needle))
      .slice(0, 30);
  }, [options, query]);

  return (
    <Field label={label} error={error}>
      <div className="relative">
        <Input
          value={open ? query : (selected?.label ?? "")}
          placeholder="Search"
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => setQuery(event.target.value)}
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {open ? (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-white shadow-lg" role="listbox">
            {filtered.length === 0 ? <li className="px-3 py-3 text-sm text-stone-500">No matches</li> : null}
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className="flex min-h-11 w-full flex-col items-start px-3 py-2 text-left hover:bg-muted"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.description ? <span className="text-xs text-stone-500">{option.description}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}

export function TextInput({
  label,
  registration,
  error,
  type = "text",
  hint,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  type?: string;
  hint?: string;
}) {
  return (
    <Field label={label} error={error} hint={hint}>
      {type === "textarea" ? <Textarea {...registration} /> : <Input type={type} {...registration} />}
    </Field>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{message}</p>;
}

export function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm md:p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
