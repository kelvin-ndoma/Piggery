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
    <form onSubmit={onSubmit}>
      <FormCard title="Feed type">
        <FormError message={error} />
        <TextInput label="Name" registration={form.register("name")} error={form.formState.errors.name} />
        <SelectField label="Category" registration={form.register("category")} options={FEED_CATEGORIES.map((value) => ({ value, label: labelize(value) }))} />
        <TextInput label="Cost per kg" type="number" registration={form.register("costPerKg", numberAs)} />
        <TextInput label="Reorder level (kg)" type="number" registration={form.register("reorderLevelKg", numberAs)} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save feed type"}</Button>
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
    <form onSubmit={onSubmit}>
      <FormCard title="Feed record">
        <FormError message={error} />
        <TextInput label="Date" type="date" registration={form.register("date")} />
        <SearchSelect label="Feed" options={feeds} value={form.watch("feedTypeId")} onChange={(value) => form.setValue("feedTypeId", value)} />
        <SelectField label="Kind" registration={form.register("kind")} options={kinds.map((value) => ({ value, label: labelize(value) }))} />
        <SearchSelect label="Pen" options={pens} value={form.watch("penId") ?? ""} onChange={(value) => form.setValue("penId", value)} />
        <TextInput label="Quantity (kg)" type="number" hint="Use a negative quantity only for an adjustment." registration={form.register("quantityKg", numberAs)} />
        {canPurchase ? <TextInput label="Cost per kg" type="number" hint="Purchases can set a new cost. Consumption uses the saved cost." registration={form.register("costPerKg", numberAs)} /> : null}
        <TextInput label="Notes" registration={form.register("notes")} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save feed record"}</Button>
      </FormCard>
    </form>
  );
}

function ObservationFields({ name, label, form }: { name: "housing" | "health" | "water" | "feeding" | "feedQuality"; label: string; form: ReturnType<typeof useRecordForm<typeof visitSchema._output>>["form"] }) {
  return (
    <div className="rounded-xl border p-3">
      <SelectField label={label} registration={form.register(`${name}.rating`)} options={OBSERVATION_RATINGS.map((value) => ({ value, label: labelize(value) }))} />
      <div className="mt-3">
        <TextInput label="Notes" registration={form.register(`${name}.notes`)} />
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
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-4">
      <FormCard title="Farm visit">
        <FormError message={error} />
        <TextInput label="Date" type="date" registration={form.register("date")} />
        <TextInput label="Farmer" registration={form.register("farmerName")} />
        <TextInput label="Other contact" registration={form.register("otherContactName")} />
        <TextInput label="Phone" registration={form.register("contactPhone")} />
        <TextInput label="Pig population" type="textarea" registration={form.register("populationSummary")} hint="Started from the pigs currently on record. Edit it to match what you saw." />
        <TextInput label="Visiting officer" registration={form.register("visitingOfficer")} />
        <TextInput label="Next visit" type="date" registration={form.register("nextVisitDate")} />
        <TextInput label="Other comments" type="textarea" registration={form.register("otherComments")} />
      </FormCard>
      <ObservationFields name="housing" label="Housing" form={form} />
      <ObservationFields name="health" label="Health" form={form} />
      <ObservationFields name="water" label="Water" form={form} />
      <ObservationFields name="feeding" label="Feeding" form={form} />
      <ObservationFields name="feedQuality" label="Feed quality" form={form} />
      <FormCard title="Recommendations">
        {recommendations.map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border p-3">
            <TextInput label="Recommendation" type="textarea" registration={form.register(`recommendations.${index}.text`)} />
            <SelectField label="Priority" registration={form.register(`recommendations.${index}.priority`)} options={TASK_PRIORITY.map((value) => ({ value, label: labelize(value) }))} />
            <SearchSelect label="Assign" options={users} value={form.watch(`recommendations.${index}.assignedUserId`) ?? ""} onChange={(value) => form.setValue(`recommendations.${index}.assignedUserId`, value)} />
            <TextInput label="Due date" type="date" registration={form.register(`recommendations.${index}.dueDate`)} />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => form.setValue("recommendations", [...recommendations, { text: "", priority: "MEDIUM", assignedUserId: "", dueDate: "" }])}>
          Add recommendation
        </Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save visit"}</Button>
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
    <form onSubmit={onSubmit} className="space-y-3">
      <FormError message={error} />
      <SelectField label="Status" registration={form.register("status")} options={TASK_STATUS.map((value) => ({ value, label: labelize(value) }))} />
      <TextInput label="Completed on" type="date" registration={form.register("completedOn")} />
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Update task"}</Button>
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
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <FormCard title="Record expense">
        <FormError message={error} />
        <TextInput label="Date" type="date" registration={form.register("date")} />
        <SelectField label="Category" registration={form.register("category")} options={EXPENSE_CATEGORIES.map((value) => ({ value, label: labelize(value) }))} />
        <TextInput label="Amount" type="number" registration={form.register("amount", numberAs)} />
        <TextInput label="Description" registration={form.register("description")} />
        <TextInput label="Payee" registration={form.register("payee")} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save expense"}</Button>
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
    <form onSubmit={onSubmit}>
      <FormCard title="New building">
        <FormError message={error} />
        <TextInput label="Name" registration={form.register("name")} />
        <TextInput label="Code" registration={form.register("code")} />
        <TextInput label="Notes" registration={form.register("notes")} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save building"}</Button>
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
    <form onSubmit={onSubmit}>
      <FormCard title="New pen">
        <FormError message={error} />
        <SearchSelect label="Building" options={buildings} value={form.watch("buildingId")} onChange={(value) => form.setValue("buildingId", value)} />
        <TextInput label="Name" registration={form.register("name")} />
        <TextInput label="Code" registration={form.register("code")} />
        <SelectField label="Type" registration={form.register("type")} options={PEN_TYPES.map((value) => ({ value, label: labelize(value) }))} />
        <TextInput label="Capacity" type="number" registration={form.register("capacity", numberAs)} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save pen"}</Button>
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
    <form onSubmit={onSubmit} className="max-w-xl">
      <FormCard title="Farm settings">
        <FormError message={error} />
        <TextInput label="Farm name" registration={form.register("name")} />
        <TextInput label="Location note" registration={form.register("locationNote")} />
        <TextInput label="Phone" registration={form.register("phone")} />
        <TextInput label="Timezone" registration={form.register("timezone")} hint="Example: Africa/Nairobi" />
        <TextInput label="Currency" registration={form.register("currency")} hint="Example: KES" />
        <TextInput label="Gestation length (days)" type="number" registration={form.register("gestationDays", numberAs)} hint="Expected farrowing is the breeding date plus this many days. 114 is the usual swine gestation length." />
        <TextInput label="Farrowing horizon (days)" type="number" registration={form.register("farrowingHorizonDays", numberAs)} />
        <TextInput label="Maximum weight (kg)" type="number" registration={form.register("maxWeightKg", numberAs)} />
        <TextInput label="Maximum daily gain (kg)" type="number" registration={form.register("maxDailyGainKg", numberAs)} hint="Faster gains are rejected unless an authorised user confirms the measurement." />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save settings"}</Button>
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
    <form onSubmit={onSubmit}>
      <FormCard title="Add a user">
        <FormError message={error} />
        <TextInput label="Name" registration={form.register("name")} />
        <TextInput label="Email" type="email" registration={form.register("email")} />
        <TextInput label="Temporary password" type="password" registration={form.register("password")} />
        <TextInput label="Phone" registration={form.register("phone")} />
        <SelectField label="Role" registration={form.register("role")} options={ROLES.filter((role) => role !== "OWNER").map((value) => ({ value, label: labelize(value) }))} />
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Create user"}</Button>
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
