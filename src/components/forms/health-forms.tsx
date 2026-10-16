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
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Record vaccination">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          {preset ? null : (
            <SearchSelect label="Pig" placeholder="Search pig, e.g. G01" options={pigs} value={pigId} onChange={(value) => { setPigId(value); form.setValue("pigId", value); }} />
          )}
          <SearchSelect label="Vaccine" placeholder="Search vaccine product" options={vaccines} value={form.watch("vaccineId")} onChange={(value) => form.setValue("vaccineId", value)} />
          <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
          <TextInput label="Dose" placeholder="e.g. 2 ml" registration={form.register("dose")} error={form.formState.errors.dose} />
          <TextInput label="Batch number" placeholder="e.g. BATCH-1042" registration={form.register("batchNumber")} />
          <TextInput label="Next due date" type="date" hint="Leave blank to use the vaccine interval, if one was set." registration={form.register("nextDueDate")} />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Given in Room 5" registration={form.register("notes")} />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5" {...form.register("recordAsHistorical")} />
          This is a historical backfill for a pig that is no longer active.
        </label>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save vaccination"}</Button>
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
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Add a vaccine product">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Name" placeholder="e.g. FMD vaccine" registration={form.register("name")} error={form.formState.errors.name} />
          <TextInput label="Manufacturer" placeholder="e.g. Product maker" registration={form.register("manufacturer")} />
          <TextInput label="Default interval (days)" type="number" placeholder="e.g. 180" hint="Optional. Used only when a vaccination does not set its own next due date." registration={form.register("defaultIntervalDays", numberAs)} />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Keep refrigerated" registration={form.register("notes")} />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save vaccine"}</Button>
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
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Health incident">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          {preset ? null : (
            <div className="sm:col-span-2">
              <SearchSelect label="Pig" placeholder="Search pig, e.g. G01" options={pigs} value={form.watch("pigId")} onChange={(value) => form.setValue("pigId", value)} />
            </div>
          )}
          <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
          <SelectField label="Severity" registration={form.register("severity")} options={HEALTH_SEVERITY.map((value) => ({ value, label: labelize(value) }))} />
          <div className="sm:col-span-2">
            <TextInput label="What did you observe?" type="textarea" placeholder="e.g. Coughing, off feed, weak hind legs" registration={form.register("symptoms")} error={form.formState.errors.symptoms} />
          </div>
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Isolated in hospital pen" registration={form.register("notes")} />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save incident"}</Button>
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
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Record treatment">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SearchSelect label="Pig" placeholder="Search pig, e.g. G01" options={pigs} value={form.watch("pigId")} onChange={(value) => form.setValue("pigId", value)} />
          <SearchSelect label="Related incident" placeholder="Search incident, or leave blank" options={incidents} value={form.watch("incidentId") ?? ""} onChange={(value) => form.setValue("incidentId", value)} />
          <TextInput label="Date" type="date" registration={form.register("date")} />
          <TextInput label="Product" placeholder="e.g. Oxytetracycline" registration={form.register("product")} error={form.formState.errors.product} />
          <TextInput label="Dose" placeholder="e.g. 5 ml" registration={form.register("dose")} error={form.formState.errors.dose} />
          <TextInput label="Route" placeholder="e.g. IM, oral" registration={form.register("route")} />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Given in the morning. Recheck in 3 days." registration={form.register("notes")} />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save treatment"}</Button>
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
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Record mortality">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchSelect label="Pig" placeholder="Search pig, e.g. G01" options={pigs} value={form.watch("pigId")} onChange={(value) => form.setValue("pigId", value)} />
          </div>
          <TextInput label="Date" type="date" registration={form.register("date")} />
          <TextInput label="Weight (kg)" type="number" placeholder="e.g. 28.5" registration={form.register("weightKg", numberAs)} />
          <TextInput label="Suspected cause" placeholder="e.g. Scours, injury" registration={form.register("suspectedCause")} />
          <TextInput label="Confirmed cause" placeholder="e.g. Confirmed by vet, or leave blank" registration={form.register("confirmedCause")} />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Found in Room 6 this morning" registration={form.register("notes")} />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required className="mt-1 h-5 w-5" />
          I confirm this pig should be marked dead. The record will be kept.
        </label>
        <Button type="submit" variant="destructive" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save mortality"}</Button>
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
