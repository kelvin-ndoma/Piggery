"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormCard, FormError, SearchSelect, SelectField, TextInput } from "@/components/forms/fields";
import { useRecordForm } from "@/components/forms/use-record-form";
import { incidentSchema, incidentStatusSchema, mortalitySchema, treatmentSchema, vaccinationSchema, vaccineSchema } from "@/schemas";
import { HEALTH_SEVERITY, HEALTH_STATUS } from "@/types/domain";
import type { SelectOption } from "@/types/api";
import { labelize } from "@/lib/utils";

const numberAs = { setValueAs: (value: string) => (value === "" ? undefined : Number(value)) };

export function VaccinationAction({ pigs, vaccines, preset }: { pigs: SelectOption[]; vaccines: SelectOption[]; preset?: string }) {
  const [pigId, setPigId] = useState(preset ?? "");
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/vaccinations",
    schema: vaccinationSchema,
    defaultValues: { pigId: preset ?? "", vaccineId: "", date: "", dose: "", batchNumber: "", nextDueDate: "", notes: "", recordAsHistorical: false },
    successMessage: "Vaccination recorded",
  });
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <FormCard title="Record vaccination">
        <FormError message={error} />
        {preset ? null : <SearchSelect label="Pig" options={pigs} value={pigId} onChange={(value) => { setPigId(value); form.setValue("pigId", value); }} />}
        <SearchSelect label="Vaccine" options={vaccines} value={form.watch("vaccineId")} onChange={(value) => form.setValue("vaccineId", value)} />
        <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
        <TextInput label="Dose" registration={form.register("dose")} error={form.formState.errors.dose} />
        <TextInput label="Batch number" registration={form.register("batchNumber")} />
        <TextInput label="Next due date" type="date" hint="Leave blank to use the vaccine interval, if one was set." registration={form.register("nextDueDate")} />
        <TextInput label="Notes" type="textarea" registration={form.register("notes")} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5" {...form.register("recordAsHistorical")} />
          This is a historical backfill for a pig that is no longer active.
        </label>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save vaccination"}</Button>
      </FormCard>
    </form>
  );
}

export function VaccineForm() {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/vaccines",
    schema: vaccineSchema,
    defaultValues: { name: "", manufacturer: "", notes: "" },
    successMessage: "Vaccine saved",
  });
  return (
    <form onSubmit={onSubmit}>
      <FormCard title="Add a vaccine product">
        <FormError message={error} />
        <TextInput label="Name" registration={form.register("name")} error={form.formState.errors.name} />
        <TextInput label="Manufacturer" registration={form.register("manufacturer")} />
        <TextInput label="Default interval (days)" type="number" hint="Optional. Used only when a vaccination does not set its own next due date." registration={form.register("defaultIntervalDays", numberAs)} />
        <TextInput label="Notes" type="textarea" registration={form.register("notes")} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save vaccine"}</Button>
      </FormCard>
    </form>
  );
}

export function IncidentAction({ pigs, preset }: { pigs: SelectOption[]; preset?: string }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/health/incidents",
    schema: incidentSchema,
    defaultValues: { pigId: preset ?? "", date: "", severity: "LOW", symptoms: "", notes: "" },
    successMessage: "Health incident recorded",
  });
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <FormCard title="Health incident">
        <FormError message={error} />
        {preset ? null : <SearchSelect label="Pig" options={pigs} value={form.watch("pigId")} onChange={(value) => form.setValue("pigId", value)} />}
        <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
        <SelectField label="Severity" registration={form.register("severity")} options={HEALTH_SEVERITY.map((value) => ({ value, label: labelize(value) }))} />
        <TextInput label="What did you observe?" type="textarea" registration={form.register("symptoms")} error={form.formState.errors.symptoms} />
        <TextInput label="Notes" type="textarea" registration={form.register("notes")} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save incident"}</Button>
      </FormCard>
    </form>
  );
}

export function TreatmentForm({ pigs, incidents }: { pigs: SelectOption[]; incidents: SelectOption[] }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/health/treatments",
    schema: treatmentSchema,
    defaultValues: { pigId: "", incidentId: "", date: "", product: "", dose: "", route: "", notes: "" },
    successMessage: "Treatment recorded",
  });
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <FormCard title="Record treatment">
        <FormError message={error} />
        <SearchSelect label="Pig" options={pigs} value={form.watch("pigId")} onChange={(value) => form.setValue("pigId", value)} />
        <SearchSelect label="Related incident" options={incidents} value={form.watch("incidentId") ?? ""} onChange={(value) => form.setValue("incidentId", value)} />
        <TextInput label="Date" type="date" registration={form.register("date")} />
        <TextInput label="Product" registration={form.register("product")} error={form.formState.errors.product} />
        <TextInput label="Dose" registration={form.register("dose")} error={form.formState.errors.dose} />
        <TextInput label="Route" registration={form.register("route")} />
        <TextInput label="Notes" type="textarea" registration={form.register("notes")} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save treatment"}</Button>
      </FormCard>
    </form>
  );
}

export function MortalityForm({ pigs }: { pigs: SelectOption[] }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/health/mortality",
    schema: mortalitySchema,
    defaultValues: { pigId: "", date: "", suspectedCause: "", confirmedCause: "", notes: "" },
    successMessage: "Mortality recorded",
    successHref: "/health",
  });
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <FormCard title="Record mortality">
        <FormError message={error} />
        <SearchSelect label="Pig" options={pigs} value={form.watch("pigId")} onChange={(value) => form.setValue("pigId", value)} />
        <TextInput label="Date" type="date" registration={form.register("date")} />
        <TextInput label="Weight (kg)" type="number" registration={form.register("weightKg", numberAs)} />
        <TextInput label="Suspected cause" registration={form.register("suspectedCause")} />
        <TextInput label="Confirmed cause" registration={form.register("confirmedCause")} />
        <TextInput label="Notes" type="textarea" registration={form.register("notes")} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required className="mt-1 h-5 w-5" />
          I confirm this pig should be marked dead. The record will be kept.
        </label>
        <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Saving..." : "Save mortality"}</Button>
      </FormCard>
    </form>
  );
}

export function IncidentStatusForm({ id, status }: { id: string; status: string }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: `/api/health/incidents/${id}`,
    method: "PATCH",
    schema: incidentStatusSchema,
    defaultValues: { status: status as "OPEN", note: "" },
    successMessage: "Incident updated",
  });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <FormError message={error} />
      <SelectField label="Status" registration={form.register("status")} options={HEALTH_STATUS.map((value) => ({ value, label: labelize(value) }))} />
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Update"}</Button>
    </form>
  );
}
