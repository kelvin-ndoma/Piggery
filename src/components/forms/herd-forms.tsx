"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormCard, FormError, SearchSelect, SelectField, TextInput } from "@/components/forms/fields";
import { useRecordForm } from "@/components/forms/use-record-form";
import { breedingSchema, createPigSchema, exitSchema, litterSchema, movementSchema, pigletSchema, saleSchema, updatePigSchema, weightSchema } from "@/schemas";
import { MOVEMENT_REASONS, PIG_CATEGORY, PIG_SEX, PIG_SOURCE, type PigCategory, type PigSex, type PigSource } from "@/types/domain";
import type { SelectOption } from "@/types/api";
import { labelize } from "@/lib/utils";

const numberAs = { setValueAs: (value: string) => (value === "" ? undefined : Number(value)) };
const sexOptions = PIG_SEX.map((value) => ({ value, label: value === "UNKNOWN" ? "Not recorded" : labelize(value) }));

export function PigForm({ pens }: { pens: SelectOption[] }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/pigs",
    schema: createPigSchema,
    defaultValues: {
      sex: undefined,
      source: undefined,
      category: undefined,
      breed: "",
      dateOfBirth: "",
      earTag: "",
      notes: "",
      currentPenId: "",
    },
    successMessage: "Pig registered",
    successHref: "/pigs",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="New pig">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Ear tag"
            required
            placeholder="e.g. ET-014"
            registration={form.register("earTag")}
            error={form.formState.errors.earTag}
          />
          <SelectField
            label="Sex"
            required
            registration={form.register("sex")}
            options={sexOptions}
            error={form.formState.errors.sex}
          />
          <TextInput
            label="Breed"
            required
            placeholder="e.g. Large White, Landrace"
            registration={form.register("breed")}
            error={form.formState.errors.breed}
          />
          <TextInput label="Date of birth" type="date" hint="Leave blank if the age is not known yet." registration={form.register("dateOfBirth")} error={form.formState.errors.dateOfBirth} />
          <SelectField
            label="Source"
            required
            registration={form.register("source")}
            options={PIG_SOURCE.map((value) => ({ value, label: labelize(value) }))}
            error={form.formState.errors.source}
          />
          <SelectField
            label="Category"
            required
            registration={form.register("category")}
            options={PIG_CATEGORY.map((value) => ({ value, label: labelize(value) }))}
            error={form.formState.errors.category}
          />
          <SearchSelect
            label="Pen"
            required
            placeholder="Search room, e.g. Room 5"
            options={pens}
            value={form.watch("currentPenId") ?? ""}
            onChange={(value) => form.setValue("currentPenId", value, { shouldValidate: true, shouldDirty: true })}
            error={form.formState.errors.currentPenId}
          />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Bought from neighbour. Confirm age and weight." registration={form.register("notes")} />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save pig"}</Button>
      </FormCard>
    </form>
  );
}

export function EditPigForm({
  pigRef,
  females,
  males,
  values,
}: {
  pigRef: string;
  females: SelectOption[];
  males: SelectOption[];
  values: {
    earTag: string;
    sex: PigSex;
    breed: string;
    dateOfBirth: string;
    source: PigSource;
    category: PigCategory;
    notes: string;
    motherId: string;
    fatherId: string;
  };
}) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: `/api/pigs/${pigRef}`,
    method: "PATCH",
    schema: updatePigSchema,
    defaultValues: values,
    successMessage: "Pig details saved",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Edit details">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Ear tag" placeholder="e.g. ET-014" registration={form.register("earTag")} />
          <SelectField label="Sex" registration={form.register("sex")} options={sexOptions} />
          <TextInput label="Breed" placeholder="e.g. Large White, Landrace, or Not recorded" registration={form.register("breed")} error={form.formState.errors.breed} />
          <TextInput label="Date of birth" type="date" hint="Leave blank if the age is not known yet." registration={form.register("dateOfBirth")} error={form.formState.errors.dateOfBirth} />
          <SelectField label="Source" registration={form.register("source")} options={PIG_SOURCE.map((value) => ({ value, label: labelize(value) }))} />
          <SelectField label="Category" registration={form.register("category")} options={PIG_CATEGORY.map((value) => ({ value, label: labelize(value) }))} />
          <SearchSelect label="Mother" placeholder="Search sow, e.g. S01" options={females} value={form.watch("motherId") ?? ""} onChange={(value) => form.setValue("motherId", value)} />
          <SearchSelect label="Father" placeholder="Search boar, e.g. B01" options={males} value={form.watch("fatherId") ?? ""} onChange={(value) => form.setValue("fatherId", value)} />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Confirm age and weight. Parity not recorded." registration={form.register("notes")} />
          </div>
        </div>
        <p className="text-sm text-stone-500">Use Move to change the room. That keeps the movement history.</p>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save details"}</Button>
      </FormCard>
    </form>
  );
}

export function AddPigletForm({
  motherId,
  breed,
  penId,
  boars,
  pens,
}: {
  motherId: string;
  breed: string;
  penId: string;
  boars: SelectOption[];
  pens: SelectOption[];
}) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/pigs",
    schema: createPigSchema,
    defaultValues: {
      pigId: "",
      earTag: "",
      sex: undefined,
      breed,
      dateOfBirth: "",
      source: "BORN_ON_FARM",
      category: "PIGLET",
      motherId,
      fatherId: "",
      currentPenId: penId,
      notes: "",
      confirmOverCapacity: true,
    },
    successMessage: "Piglet added",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Add a piglet">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Pig ID"
            placeholder="e.g. S01-11 or leave blank"
            hint="Leave blank to generate the next ID."
            registration={form.register("pigId")}
          />
          <SelectField
            label="Sex"
            required
            registration={form.register("sex")}
            options={sexOptions}
            error={form.formState.errors.sex}
          />
          <TextInput
            label="Ear tag"
            required
            placeholder="e.g. ET-021"
            registration={form.register("earTag")}
            error={form.formState.errors.earTag}
          />
          <TextInput
            label="Breed"
            required
            placeholder="e.g. Large White"
            registration={form.register("breed")}
            error={form.formState.errors.breed}
          />
          <SelectField
            label="Source"
            required
            registration={form.register("source")}
            options={PIG_SOURCE.map((value) => ({ value, label: labelize(value) }))}
            error={form.formState.errors.source}
          />
          <SelectField
            label="Category"
            required
            registration={form.register("category")}
            options={PIG_CATEGORY.map((value) => ({ value, label: labelize(value) }))}
            error={form.formState.errors.category}
          />
          <TextInput label="Date of birth" type="date" hint="Leave blank if it is not known yet." registration={form.register("dateOfBirth")} />
          <SearchSelect label="Father" placeholder="Search boar, e.g. B01" options={boars} value={form.watch("fatherId") ?? ""} onChange={(value) => form.setValue("fatherId", value)} />
          <SearchSelect
            label="Pen"
            required
            placeholder="Search room, e.g. Room 1"
            options={pens}
            value={form.watch("currentPenId") ?? ""}
            onChange={(value) => form.setValue("currentPenId", value, { shouldValidate: true, shouldDirty: true })}
            error={form.formState.errors.currentPenId}
          />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Born in Room 1. Sex not confirmed yet." registration={form.register("notes")} />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Add piglet"}</Button>
      </FormCard>
    </form>
  );
}

export function WeightAction({ pigs, preset }: { pigs: SelectOption[]; preset?: string }) {
  const [pigId, setPigId] = useState(preset ?? "");
  return (
    <div className="w-full space-y-4">
      {preset ? null : (
        <FormCard title="Choose a pig">
          <SearchSelect label="Pig" placeholder="Search pig, e.g. G01" options={pigs} value={pigId} onChange={setPigId} />
        </FormCard>
      )}
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
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Record weight">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
          <TextInput label="Weight (kg)" type="number" placeholder="e.g. 42.5" registration={form.register("weightKg", numberAs)} error={form.formState.errors.weightKg} />
          <div className="sm:col-span-2">
            <TextInput label="Notes" placeholder="e.g. Weighed after morning feed" registration={form.register("notes")} />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5" {...form.register("confirmUnusual")} />
          Confirm an unusual gain or loss. Only an owner, manager, or vet can save it.
        </label>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save weight"}</Button>
      </FormCard>
    </form>
  );
}

export function MoveAction({ pigs, pens, preset }: { pigs: SelectOption[]; pens: SelectOption[]; preset?: string }) {
  const [pigId, setPigId] = useState(preset ?? "");
  return (
    <div className="w-full space-y-4">
      {preset ? null : (
        <FormCard title="Choose a pig">
          <SearchSelect label="Pig" placeholder="Search pig, e.g. G01" options={pigs} value={pigId} onChange={setPigId} />
        </FormCard>
      )}
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
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Move pig">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
          <SearchSelect label="To pen" placeholder="Search room, e.g. Room 5" options={pens} value={form.watch("toPenId")} onChange={(value) => form.setValue("toPenId", value)} />
          <SelectField label="Reason" registration={form.register("reason")} options={MOVEMENT_REASONS.filter((reason) => reason !== "OFF_FARM").map((value) => ({ value, label: labelize(value) }))} />
          <TextInput label="Notes" placeholder="e.g. Moved for growth" registration={form.register("notes")} />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5" {...form.register("confirmOverCapacity")} />
          Record the move even if the pen is at capacity.
        </label>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save movement"}</Button>
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
    successHref: "/pigs",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Transfer or cull">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Date" type="date" registration={form.register("date")} />
          <SelectField label="Outcome" registration={form.register("type")} options={[{ value: "TRANSFERRED", label: "Transferred" }, { value: "CULLED", label: "Culled" }]} />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Sold to neighbour farm" registration={form.register("notes")} />
          </div>
        </div>
        <Button type="submit" variant="destructive" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Update status"}</Button>
      </FormCard>
    </form>
  );
}

export function BreedingForm({ sows, boars, presetSowId = "" }: { sows: SelectOption[]; boars: SelectOption[]; presetSowId?: string }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/breeding",
    schema: breedingSchema,
    defaultValues: { sowId: presetSowId, boarId: "", breedingDate: "", method: "NATURAL", notes: "" },
    successMessage: "Serving recorded",
    successHref: "/serving",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Record serving">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SearchSelect label="Sow" required placeholder="Search sow, e.g. S01" options={sows} value={form.watch("sowId")} onChange={(value) => form.setValue("sowId", value)} />
          <SearchSelect label="Boar" placeholder="Search boar, e.g. B01" options={boars} value={form.watch("boarId") ?? ""} onChange={(value) => form.setValue("boarId", value)} />
          <TextInput label="Served on" type="date" registration={form.register("breedingDate")} error={form.formState.errors.breedingDate} />
          <SelectField
            label="Method"
            registration={form.register("method")}
            options={[
              { value: "NATURAL", label: "Natural service" },
              { value: "ARTIFICIAL_INSEMINATION", label: "Artificial insemination" },
            ]}
          />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Natural service in Room 4" registration={form.register("notes")} />
          </div>
        </div>
        <p className="text-sm text-stone-500">Due to farrow is the served-on date plus the farm gestation length.</p>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save serving"}</Button>
      </FormCard>
    </form>
  );
}

export function LitterForm({ sows, boars, breeding, presetMotherId = "" }: { sows: SelectOption[]; boars: SelectOption[]; breeding: SelectOption[]; presetMotherId?: string }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/litters",
    schema: litterSchema,
    defaultValues: { motherId: presetMotherId, fatherId: "", breedingId: "", birthDate: "", notes: "" },
    successMessage: "Litter recorded",
    successHref: "/litters",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Record birth">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SearchSelect label="Mother" placeholder="Search sow, e.g. S01" options={sows} value={form.watch("motherId")} onChange={(value) => form.setValue("motherId", value)} />
          <SearchSelect label="Father" placeholder="Search boar, e.g. B01" options={boars} value={form.watch("fatherId") ?? ""} onChange={(value) => form.setValue("fatherId", value)} />
          <SearchSelect label="Serving record" placeholder="Search serving, or leave blank" options={breeding} value={form.watch("breedingId") ?? ""} onChange={(value) => form.setValue("breedingId", value)} />
          <TextInput label="Birth date" type="date" registration={form.register("birthDate")} error={form.formState.errors.birthDate} />
          <TextInput label="Born alive" type="number" placeholder="e.g. 10" registration={form.register("bornAlive", numberAs)} error={form.formState.errors.bornAlive} />
          <TextInput label="Stillborn" type="number" placeholder="e.g. 1" registration={form.register("stillborn", numberAs)} error={form.formState.errors.stillborn} />
          <TextInput label="Male" type="number" placeholder="e.g. 5" registration={form.register("male", numberAs)} error={form.formState.errors.male} />
          <TextInput label="Female" type="number" placeholder="e.g. 5" registration={form.register("female", numberAs)} error={form.formState.errors.female} />
          <div className="sm:col-span-2">
            <TextInput label="Notes" type="textarea" placeholder="e.g. Farrowed overnight in Room 1" registration={form.register("notes")} />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save litter"}</Button>
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
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Register piglets">
        <FormError message={error} />
        <p className="text-sm text-stone-500">Each piglet receives the next unique pig ID. Counts cannot exceed the litter record.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchSelect label="Pen" placeholder="Search room, e.g. Room 1" options={penOptions} value={form.watch("penId") ?? ""} onChange={(value) => form.setValue("penId", value)} />
          </div>
        </div>
        <div className="space-y-3">
          {piglets.map((_, index) => (
            <div key={index} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-3">
              <SelectField label="Sex" registration={form.register(`piglets.${index}.sex`)} options={sexOptions} />
              <TextInput label="Ear tag" placeholder="e.g. ET-021" registration={form.register(`piglets.${index}.earTag`)} />
              <TextInput label="Birth weight (kg)" type="number" placeholder="e.g. 1.4" registration={form.register(`piglets.${index}.weightKg`, numberAs)} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => form.setValue("piglets", [...piglets, { sex: "FEMALE", earTag: "" }])}>Add piglet</Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Register piglets"}</Button>
        </div>
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
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Record sale">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Date" type="date" registration={form.register("date")} error={form.formState.errors.date} />
          <TextInput label="Buyer" placeholder="e.g. Local butcher" registration={form.register("buyerName")} error={form.formState.errors.buyerName} />
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-3">
              <SearchSelect label={`Pig ${index + 1}`} placeholder="Search pig, e.g. G01" options={pigs} value={item.pigId ?? ""} onChange={(value) => form.setValue(`items.${index}.pigId`, value)} />
              <TextInput label="Price" type="number" placeholder="e.g. 18000" registration={form.register(`items.${index}.price`, numberAs)} />
              <TextInput label="Weight (kg)" type="number" placeholder="e.g. 85" registration={form.register(`items.${index}.weightKg`, numberAs)} />
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => form.setValue("items", [...items, { pigId: "", price: 0 }])}>Add another pig</Button>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required className="mt-1 h-5 w-5" />
          I confirm these pigs should be marked sold. They stay in the historical record.
        </label>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save sale"}</Button>
      </FormCard>
    </form>
  );
}
