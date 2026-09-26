import { notFound } from "next/navigation";
import { ExpenseForm } from "@/components/forms/ops-forms";
import { PageHeader } from "@/components/page-header";
import { RecordTable } from "@/components/record-table";
import { can } from "@/lib/permissions";
import { requireFarmContext } from "@/lib/context";
import { formatDisplayDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { labelize } from "@/lib/utils";
import { listExpenses } from "@/services/finance";

export default async function ExpensesPage() {
  const ctx = await requireFarmContext();
  if (!can(ctx.role, "finance:read")) notFound();
  const expenses = await listExpenses(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" />
      <RecordTable
        columns={[{ key: "date", label: "Date" }, { key: "category", label: "Category" }, { key: "description", label: "Description" }, { key: "amount", label: "Amount" }]}
        rows={expenses.map((expense) => ({ id: expense.id, cells: { date: formatDisplayDate(expense.date), category: labelize(expense.category), description: expense.description, amount: formatMoney(expense.amount, expense.currency) } }))}
        empty={{ title: "No expenses yet." }}
      />
      {can(ctx.role, "finance:write") ? <div className="max-w-xl"><ExpenseForm /></div> : null}
    </div>
  );
}
