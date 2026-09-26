"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormCard, FormError, SearchSelect, SelectField, TextInput } from "@/components/forms/fields";
import { useRecordForm } from "@/components/forms/use-record-form";
import { breedingSchema, createPigSchema, exitSchema, litterSchema, movementSchema, pigletSchema, saleSchema, weightSchema } from "@/schemas";
import { BREEDING_METHODS, MOVEMENT_REASONS, PIG_CATEGORY, PIG_SEX, PIG_SOURCE } from "@/types/domain";
import type { SelectOption } from "@/types/api";
import { labelize } from "@/lib/utils";

const numberAs = { setValueAs: (value: string) => (value === "" ? undefined : Number(value)) };

export function PigForm({ pens, pigs, showPrice }: { pens: SelectOption[]; pigs: SelectOption[]; showPrice: boolean }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/pigs",
    schema: createPigSchema,
    defaultValues: {
      sex: "FEMALE",
      source: "BORN_ON_FARM",
      category: "PIGLET",
      breed: "",
      dateOfBirth: "",
      pigId: "",
      earTag: "",
      notes: "",
      motherId: "",
      fatherId: "",
      currentPenId: "",
    },
    successMessage: "Pig registered",
    successHref: "/pigs/{pigId}",
  });
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <FormCard title="New pig">
        <FormError message={error} />
        <TextInput label="Pig ID" hint="Leave blank to generate the next ID, such as PIG-0041." registration={form.register("pigId")} error={form.formState.errors.pigId} />
        <TextInput label="Ear tag" registration={form.register("earTag")} />
        <SelectField label="Sex" registration={form.register("sex")} options={PIG_SEX.map((value) => ({ value, label: labelize(value) }))} />
        <TextInput label="Breed" registration={form.register("breed")} error={form.formState.errors.breed} />
        <TextInput label="Date of birth" type="date" registration={form.register("dateOfBirth")} error={form.formState.errors.dateOfBirth} />
        <SelectField label="Source" registration={form.register("source")} options={PIG_SOURCE.map((value) => ({ value, label: labelize(value) }))} />
        <SelectField label="Category" registration={form.register("category")} options={PIG_CATEGORY.map((value) => ({ value, label: labelize(value) }))} />
        <SearchSelect label="Pen" options={pens} value={form.watch("currentPenId") ?? ""} onChange={(value) => form.setValue("currentPenId", value)} />
        <SearchSelect label="Mother" options={pigs} value={form.watch("motherId") ?? ""} onChange={(value) => form.setValue("motherId", value)} />
        <SearchSelect label="Father" options={pigs} value={form.watch("fatherId") ?? ""} onChange={(value) => form.setValue("fatherId", value)} />
        <TextInput label="Notes" type="textarea" registration={form.register("notes")} />
        {showPrice ? <TextInput label="Acquisition price" type="number" registration={form.register("acquisitionPrice", numberAs)} hint="Stored for the owner and manager." /> : null}
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save pig"}</Button>
      </FormCard>
    </form>
  );
}

export function WeightAction({ pigs, preset }: { pigs: SelectOption[]; preset?: string }) {
  const [pigId, setPigId] = useState(preset ?? "");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      {preset ? null : <FormCard title="Choose a pig"><SearchSelect label="Pig" options={pigs} value={pigId} onChange={setPigId} /></FormCard>}
      {pigId ? <DirectWeightForm key={pigId} pigRef={pigId} /> : null}
    </div>
  );
}

export function DirectWeightForm({ pigRef }: { pigRef: string }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: `/api/pigs/${pigRef}/weights`,
    schema: weightSchema,
    defaultValues: { date: "", notes: "", confirmUnusual: false },
    successMessage: "Weight recorded",
  });
  return (
    <form onSubmit={onSubmit}>
      <FormCard title="Record weight">
        <FormError message={error} />
        <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
        <TextInput label="Weight (kg)" type="number" registration={form.register("weightKg", numberAs)} error={form.formState.errors.weightKg} />
        <TextInput label="Notes" registration={form.register("notes")} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5" {...form.register("confirmUnusual")} />
          Confirm an unusual gain or loss. Only an owner, manager, or vet can save it.
        </label>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save weight"}</Button>
      </FormCard>
    </form>
  );
}

export function MoveAction({ pigs, pens, preset }: { pigs: SelectOption[]; pens: SelectOption[]; preset?: string }) {
  const [pigId, setPigId] = useState(preset ?? "");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      {preset ? null : <FormCard title="Choose a pig"><SearchSelect label="Pig" options={pigs} value={pigId} onChange={setPigId} /></FormCard>}
      {pigId ? <MoveForm key={pigId} pigRef={pigId} pens={pens} /> : null}
    </div>
  );
}

function MoveForm({ pigRef, pens }: { pigRef: string; pens: SelectOption[] }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: `/api/pigs/${pigRef}/movements`,
    schema: movementSchema,
    defaultValues: { date: "", toPenId: "", reason: "GROWTH", notes: "", confirmOverCapacity: false },
    successMessage: "Pig moved",
  });
  return (
    <form onSubmit={onSubmit}>
      <FormCard title="Move pig">
        <FormError message={error} />
        <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
        <SearchSelect label="To pen" options={pens} value={form.watch("toPenId")} onChange={(value) => form.setValue("toPenId", value)} />
        <SelectField label="Reason" registration={form.register("reason")} options={MOVEMENT_REASONS.filter((reason) => reason !== "OFF_FARM").map((value) => ({ value, label: labelize(value) }))} />
        <TextInput label="Notes" registration={form.register("notes")} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5" {...form.register("confirmOverCapacity")} />
          Record the move even if the pen is at capacity.
        </label>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save movement"}</Button>
      </FormCard>
    </form>
  );
}

export function ExitForm({ pigRef }: { pigRef: string }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: `/api/pigs/${pigRef}/exit`,
    schema: exitSchema,
    defaultValues: { date: "", type: "TRANSFERRED", notes: "" },
    successMessage: "Status updated",
  });
  return (
    <form onSubmit={onSubmit}>
      <FormCard title="Transfer or cull">
        <FormError message={error} />
        <TextInput label="Date" type="date" registration={form.register("date")} />
        <SelectField label="Outcome" registration={form.register("type")} options={[{ value: "TRANSFERRED", label: "Transferred" }, { value: "CULLED", label: "Culled" }]} />
        <TextInput label="Notes" type="textarea" registration={form.register("notes")} />
        <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Saving..." : "Update status"}</Button>
      </FormCard>
    </form>
  );
}

export function BreedingForm({ sows, boars }: { sows: SelectOption[]; boars: SelectOption[] }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/breeding",
    schema: breedingSchema,
    defaultValues: { sowId: "", boarId: "", breedingDate: "", method: "NATURAL", notes: "" },
    successMessage: "Breeding recorded",
    successHref: "/breeding",
  });
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <FormCard title="Record breeding">
        <FormError message={error} />
        <SearchSelect label="Sow" options={sows} value={form.watch("sowId")} onChange={(value) => form.setValue("sowId", value)} />
        <SearchSelect label="Boar" options={boars} value={form.watch("boarId") ?? ""} onChange={(value) => form.setValue("boarId", value)} />
        <TextInput label="Breeding date" type="date" registration={form.register("breedingDate")} error={form.formState.errors.breedingDate} />
        <SelectField label="Method" registration={form.register("method")} options={BREEDING_METHODS.map((value) => ({ value, label: labelize(value) }))} />
        <TextInput label="Notes" type="textarea" registration={form.register("notes")} />
        <p className="text-sm text-stone-500">Expected farrowing is calculated from the farm gestation setting.</p>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save breeding"}</Button>
      </FormCard>
    </form>
  );
}

export function LitterForm({ sows, boars, breeding }: { sows: SelectOption[]; boars: SelectOption[]; breeding: SelectOption[] }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/litters",
    schema: litterSchema,
    defaultValues: { motherId: "", fatherId: "", breedingId: "", birthDate: "", notes: "" },
    successMessage: "Litter recorded",
    successHref: "/litters",
  });
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <FormCard title="Record birth">
        <FormError message={error} />
        <SearchSelect label="Mother" options={sows} value={form.watch("motherId")} onChange={(value) => form.setValue("motherId", value)} />
        <SearchSelect label="Father" options={boars} value={form.watch("fatherId") ?? ""} onChange={(value) => form.setValue("fatherId", value)} />
        <SearchSelect label="Breeding record" options={breeding} value={form.watch("breedingId") ?? ""} onChange={(value) => form.setValue("breedingId", value)} />
        <TextInput label="Birth date" type="date" registration={form.register("birthDate")} error={form.formState.errors.birthDate} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Born alive" type="number" registration={form.register("bornAlive", numberAs)} error={form.formState.errors.bornAlive} />
          <TextInput label="Stillborn" type="number" registration={form.register("stillborn", numberAs)} error={form.formState.errors.stillborn} />
          <TextInput label="Male" type="number" registration={form.register("male", numberAs)} error={form.formState.errors.male} />
          <TextInput label="Female" type="number" registration={form.register("female", numberAs)} error={form.formState.errors.female} />
        </div>
        <TextInput label="Notes" type="textarea" registration={form.register("notes")} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save litter"}</Button>
      </FormCard>
    </form>
  );
}

export function PigletForm({ litterId, penOptions }: { litterId: string; penOptions: SelectOption[] }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: `/api/litters/${litterId}/piglets`,
    schema: pigletSchema,
    defaultValues: { penId: "", piglets: [{ sex: "FEMALE", earTag: "" }] },
    successMessage: "Piglets registered",
  });
  const piglets = form.watch("piglets");
  return (
    <form onSubmit={onSubmit}>
      <FormCard title="Register piglets">
        <FormError message={error} />
        <p className="text-sm text-stone-500">Each piglet receives the next unique pig ID. Counts cannot exceed the litter record.</p>
        <SearchSelect label="Pen" options={penOptions} value={form.watch("penId") ?? ""} onChange={(value) => form.setValue("penId", value)} />
        {piglets.map((_, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-3">
            <SelectField label="Sex" registration={form.register(`piglets.${index}.sex`)} options={PIG_SEX.map((value) => ({ value, label: labelize(value) }))} />
            <TextInput label="Ear tag" registration={form.register(`piglets.${index}.earTag`)} />
            <TextInput label="Birth weight (kg)" type="number" registration={form.register(`piglets.${index}.weightKg`, numberAs)} />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => form.setValue("piglets", [...piglets, { sex: "FEMALE", earTag: "" }])}>Add piglet</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Register piglets"}</Button>
      </FormCard>
    </form>
  );
}

export function SaleForm({ pigs }: { pigs: SelectOption[] }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/sales",
    schema: saleSchema,
    defaultValues: { date: "", buyerName: "", notes: "", items: [{ pigId: "", price: undefined }] },
    successMessage: "Sale recorded",
    successHref: "/sales",
  });
  const items = form.watch("items");
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <FormCard title="Record sale">
        <FormError message={error} />
        <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
        <TextInput label="Buyer" registration={form.register("buyerName")} error={form.formState.errors.buyerName} />
        {items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-xl border p-3">
            <SearchSelect label={`Pig ${index + 1}`} options={pigs} value={item.pigId ?? ""} onChange={(value) => form.setValue(`items.${index}.pigId`, value)} />
            <TextInput label="Price" type="number" registration={form.register(`items.${index}.price`, numberAs)} />
            <TextInput label="Weight (kg)" type="number" registration={form.register(`items.${index}.weightKg`, numberAs)} />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => form.setValue("items", [...items, { pigId: "", price: 0 }])}>Add another pig</Button>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required className="mt-1 h-5 w-5" />
          I confirm these pigs should be marked sold. They stay in the historical record.
        </label>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save sale"}</Button>
      </FormCard>
    </form>
  );
}
