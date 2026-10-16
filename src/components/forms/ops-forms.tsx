"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormCard, FormError, SearchSelect, SelectField, TextInput } from "@/components/forms/fields";
import { useRecordForm } from "@/components/forms/use-record-form";
import {
  buildingSchema,
  createUserSchema,
  expenseSchema,
  farmSettingsSchema,
  feedRecordSchema,
  feedTypeSchema,
  penSchema,
  recommendationUpdateSchema,
  visitSchema,
} from "@/schemas";
import {
  EXPENSE_CATEGORIES,
  FEED_CATEGORIES,
  FEED_KINDS,
  OBSERVATION_RATINGS,
  PEN_TYPES,
  ROLES,
  TASK_PRIORITY,
  TASK_STATUS,
} from "@/types/domain";
import type { SelectOption } from "@/types/api";
import { labelize } from "@/lib/utils";

const numberAs = { setValueAs: (value: string) => (value === "" ? undefined : Number(value)) };

export function FeedTypeForm() {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/feed/types",
    schema: feedTypeSchema,
    defaultValues: { name: "", category: "CUSTOM", costPerKg: 0, reorderLevelKg: 0, notes: "" },
    successMessage: "Feed type saved",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Feed type">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Name" placeholder="e.g. Grower mash" registration={form.register("name")} error={form.formState.errors.name} />
          <SelectField label="Category" registration={form.register("category")} options={FEED_CATEGORIES.map((value) => ({ value, label: labelize(value) }))} />
          <TextInput label="Cost per kg" type="number" placeholder="e.g. 45" registration={form.register("costPerKg", numberAs)} />
          <TextInput label="Reorder level (kg)" type="number" placeholder="e.g. 100" registration={form.register("reorderLevelKg", numberAs)} />
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save feed type"}</Button>
      </FormCard>
    </form>
  );
}

export function FeedRecordForm({ feeds, pens, canPurchase }: { feeds: SelectOption[]; pens: SelectOption[]; canPurchase: boolean }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/feed",
    schema: feedRecordSchema,
    defaultValues: { date: "", feedTypeId: "", penId: "", kind: "CONSUMPTION", notes: "" },
    successMessage: "Feed recorded",
  });
  const kinds = FEED_KINDS.filter((kind) => canPurchase || kind === "CONSUMPTION");
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Feed record">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Date" type="date" registration={form.register("date")} />
          <SelectField label="Kind" registration={form.register("kind")} options={kinds.map((value) => ({ value, label: labelize(value) }))} />
          <SearchSelect label="Feed" placeholder="Search feed type" options={feeds} value={form.watch("feedTypeId")} onChange={(value) => form.setValue("feedTypeId", value)} />
          <SearchSelect label="Pen" placeholder="Search room, e.g. Room 5" options={pens} value={form.watch("penId") ?? ""} onChange={(value) => form.setValue("penId", value)} />
          <TextInput label="Quantity (kg)" type="number" placeholder="e.g. 25" hint="Use a negative quantity only for an adjustment." registration={form.register("quantityKg", numberAs)} />
          {canPurchase ? (
            <TextInput label="Cost per kg" type="number" placeholder="e.g. 45" hint="Purchases can set a new cost. Consumption uses the saved cost." registration={form.register("costPerKg", numberAs)} />
          ) : null}
          <div className="sm:col-span-2">
            <TextInput label="Notes" placeholder="e.g. Morning feed for Room 7" registration={form.register("notes")} />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save feed record"}</Button>
      </FormCard>
    </form>
  );
}

function ObservationFields({
  name,
  label,
  form,
}: {
  name: "housing" | "health" | "water" | "feeding" | "feedQuality";
  label: string;
  form: ReturnType<typeof useRecordForm<typeof visitSchema._output>>["form"];
}) {
  return (
    <div className="rounded-xl border p-3">
      <SelectField label={label} registration={form.register(`${name}.rating`)} options={OBSERVATION_RATINGS.map((value) => ({ value, label: labelize(value) }))} />
      <div className="mt-3">
        <TextInput label="Notes" placeholder={`e.g. Notes about ${label.toLowerCase()}`} registration={form.register(`${name}.notes`)} />
      </div>
    </div>
  );
}

export function VisitForm({ suggestion, users }: { suggestion: string; users: SelectOption[] }) {
  const record = useRecordForm({
    url: "/api/farm-visits",
    schema: visitSchema,
    defaultValues: {
      date: "",
      farmerName: "",
      otherContactName: "",
      contactPhone: "",
      populationSummary: suggestion,
      visitingOfficer: "",
      otherComments: "",
      nextVisitDate: "",
      housing: { rating: "GOOD", notes: "" },
      health: { rating: "GOOD", notes: "" },
      water: { rating: "GOOD", notes: "" },
      feeding: { rating: "GOOD", notes: "" },
      feedQuality: { rating: "GOOD", notes: "" },
      recommendations: [],
    },
    successMessage: "Farm visit saved",
    successHref: "/visits",
  });
  const { form, error, pending, onSubmit } = record;
  const recommendations = form.watch("recommendations") ?? [];
  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <FormCard title="Farm visit">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Date" type="date" registration={form.register("date")} />
          <TextInput label="Next visit" type="date" registration={form.register("nextVisitDate")} />
          <TextInput label="Farmer" placeholder="e.g. Anthony" registration={form.register("farmerName")} />
          <TextInput label="Other contact" placeholder="e.g. Farm manager" registration={form.register("otherContactName")} />
          <TextInput label="Phone" placeholder="e.g. +254700000000" registration={form.register("contactPhone")} />
          <TextInput label="Visiting officer" placeholder="e.g. Vet name" registration={form.register("visitingOfficer")} />
          <div className="sm:col-span-2">
            <TextInput label="Pig population" type="textarea" registration={form.register("populationSummary")} hint="Started from the pigs currently on record. Edit it to match what you saw." />
          </div>
          <div className="sm:col-span-2">
            <TextInput label="Other comments" type="textarea" placeholder="e.g. Overall farm condition notes" registration={form.register("otherComments")} />
          </div>
        </div>
      </FormCard>
      <section className="rounded-2xl border bg-white p-4 shadow-sm md:p-6">
        <h2 className="mb-4 text-lg font-semibold">Observations</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ObservationFields name="housing" label="Housing" form={form} />
          <ObservationFields name="health" label="Health" form={form} />
          <ObservationFields name="water" label="Water" form={form} />
          <ObservationFields name="feeding" label="Feeding" form={form} />
          <ObservationFields name="feedQuality" label="Feed quality" form={form} />
        </div>
      </section>
      <FormCard title="Recommendations">
        <div className="space-y-3">
          {recommendations.map((_, index) => (
            <div key={index} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextInput label="Recommendation" type="textarea" placeholder="e.g. Repair drinker in Room 6" registration={form.register(`recommendations.${index}.text`)} />
              </div>
              <SelectField label="Priority" registration={form.register(`recommendations.${index}.priority`)} options={TASK_PRIORITY.map((value) => ({ value, label: labelize(value) }))} />
              <SearchSelect label="Assign" placeholder="Search team member" options={users} value={form.watch(`recommendations.${index}.assignedUserId`) ?? ""} onChange={(value) => form.setValue(`recommendations.${index}.assignedUserId`, value)} />
              <TextInput label="Due date" type="date" registration={form.register(`recommendations.${index}.dueDate`)} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => form.setValue("recommendations", [...recommendations, { text: "", priority: "MEDIUM", assignedUserId: "", dueDate: "" }])}>
            Add recommendation
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save visit"}</Button>
        </div>
      </FormCard>
    </form>
  );
}

export function RecommendationStatusForm({ id }: { id: string }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: `/api/recommendations/${id}`,
    method: "PATCH",
    schema: recommendationUpdateSchema,
    defaultValues: { status: "OPEN", assignedUserId: "", dueDate: "", completedOn: "" },
    successMessage: "Recommendation updated",
  });
  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <FormError message={error} />
      <SelectField label="Status" registration={form.register("status")} options={TASK_STATUS.map((value) => ({ value, label: labelize(value) }))} />
      <TextInput label="Completed on" type="date" registration={form.register("completedOn")} />
      <div className="sm:col-span-2">
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Update task"}</Button>
      </div>
    </form>
  );
}

export function ExpenseForm() {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/expenses",
    schema: expenseSchema,
    defaultValues: { date: "", category: "OTHER", description: "", payee: "" },
    successMessage: "Expense recorded",
    successHref: "/expenses",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Record expense">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Date" type="date" registration={form.register("date")} />
          <SelectField label="Category" registration={form.register("category")} options={EXPENSE_CATEGORIES.map((value) => ({ value, label: labelize(value) }))} />
          <TextInput label="Amount" type="number" placeholder="e.g. 2500" registration={form.register("amount", numberAs)} />
          <TextInput label="Payee" placeholder="e.g. Feed supplier" registration={form.register("payee")} />
          <div className="sm:col-span-2">
            <TextInput label="Description" placeholder="e.g. Bags of grower feed" registration={form.register("description")} />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save expense"}</Button>
      </FormCard>
    </form>
  );
}

export function BuildingForm() {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/buildings",
    schema: buildingSchema,
    defaultValues: { name: "", code: "", notes: "" },
    successMessage: "Building saved",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="New building">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Name" placeholder="e.g. Rooms 1–9" registration={form.register("name")} />
          <TextInput label="Code" placeholder="e.g. R19" registration={form.register("code")} />
          <div className="sm:col-span-2">
            <TextInput label="Notes" placeholder="e.g. Older block" registration={form.register("notes")} />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save building"}</Button>
      </FormCard>
    </form>
  );
}

export function PenForm({ buildings }: { buildings: SelectOption[] }) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/pens",
    schema: penSchema,
    defaultValues: { buildingId: "", name: "", code: "", type: "MIXED", notes: "" },
    successMessage: "Pen saved",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="New pen">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchSelect label="Building" placeholder="Search building" options={buildings} value={form.watch("buildingId")} onChange={(value) => form.setValue("buildingId", value)} />
          </div>
          <TextInput label="Name" placeholder="e.g. Room 5" registration={form.register("name")} />
          <TextInput label="Code" placeholder="e.g. 5" registration={form.register("code")} />
          <SelectField label="Type" registration={form.register("type")} options={PEN_TYPES.map((value) => ({ value, label: labelize(value) }))} />
          <TextInput label="Capacity" type="number" placeholder="e.g. 10" registration={form.register("capacity", numberAs)} />
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save pen"}</Button>
      </FormCard>
    </form>
  );
}

export function SettingsForm({
  values,
}: {
  values: {
    name: string;
    locationNote: string;
    phone: string;
    timezone: string;
    currency: string;
    gestationDays: number;
    farrowingHorizonDays: number;
    maxWeightKg: number;
    maxDailyGainKg: number;
  };
}) {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/farm",
    method: "PATCH",
    schema: farmSettingsSchema,
    defaultValues: values,
    successMessage: "Farm settings saved",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Farm settings">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Farm name" placeholder="e.g. Anthony Pig Farm" registration={form.register("name")} />
          <TextInput label="Phone" placeholder="e.g. +254700000000" registration={form.register("phone")} />
          <div className="sm:col-span-2">
            <TextInput label="Location note" placeholder="e.g. Short note about the farm location or stock position" registration={form.register("locationNote")} />
          </div>
          <TextInput label="Timezone" placeholder="e.g. Africa/Nairobi" registration={form.register("timezone")} hint="Example: Africa/Nairobi" />
          <TextInput label="Currency" placeholder="e.g. KES" registration={form.register("currency")} hint="Example: KES" />
          <TextInput label="Gestation length (days)" type="number" placeholder="e.g. 114" registration={form.register("gestationDays", numberAs)} hint="Expected farrowing is the breeding date plus this many days. 114 is the usual swine gestation length." />
          <TextInput label="Farrowing horizon (days)" type="number" placeholder="e.g. 14" registration={form.register("farrowingHorizonDays", numberAs)} />
          <TextInput label="Maximum weight (kg)" type="number" placeholder="e.g. 400" registration={form.register("maxWeightKg", numberAs)} />
          <TextInput label="Maximum daily gain (kg)" type="number" placeholder="e.g. 2" registration={form.register("maxDailyGainKg", numberAs)} hint="Faster gains are rejected unless an authorised user confirms the measurement." />
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save settings"}</Button>
      </FormCard>
    </form>
  );
}

export function UserForm() {
  const { form, error, pending, onSubmit } = useRecordForm({
    url: "/api/users",
    schema: createUserSchema,
    defaultValues: { name: "", email: "", password: "", phone: "", role: "FARM_WORKER" },
    successMessage: "User created",
  });
  return (
    <form onSubmit={onSubmit} className="w-full">
      <FormCard title="Add a user">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Name" placeholder="e.g. Jane Wanjiku" registration={form.register("name")} />
          <TextInput label="Email" type="email" placeholder="e.g. jane@farm.test" registration={form.register("email")} />
          <TextInput label="Temporary password" type="password" placeholder="At least 8 characters" registration={form.register("password")} />
          <TextInput label="Phone" placeholder="e.g. +254700000000" registration={form.register("phone")} />
          <SelectField label="Role" registration={form.register("role")} options={ROLES.filter((role) => role !== "OWNER").map((value) => ({ value, label: labelize(value) }))} />
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Create user"}</Button>
      </FormCard>
    </form>
  );
}

export function BreedingStatusButtons({ id }: { id: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function update(status: "CONFIRMED_PREGNANT" | "NOT_PREGNANT" | "FAILED") {
    setPending(true);
    setMessage(null);
    const response = await fetch(`/api/breeding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as { success: boolean; error?: { message: string } };
    setPending(false);
    if (!payload.success) setMessage(payload.error?.message ?? "Could not update breeding.");
    else window.location.reload();
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={pending} onClick={() => update("CONFIRMED_PREGNANT")}>Confirm pregnant</Button>
      <Button type="button" variant="outline" disabled={pending} onClick={() => update("NOT_PREGNANT")}>Not pregnant</Button>
      <Button type="button" variant="ghost" disabled={pending} onClick={() => update("FAILED")}>Failed</Button>
      {message ? <p className="w-full text-sm text-rose-700">{message}</p> : null}
    </div>
  );
}
