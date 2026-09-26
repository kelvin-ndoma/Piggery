import "server-only";
import { AppError } from "@/lib/errors";
import { roundTo } from "@/lib/rules";
import type { FarmContext } from "@/lib/context";
import { Expense, Sale } from "@/models/operations";
import { HealthIncident } from "@/models/health";
import { Pig } from "@/models/pig";
import type { ExpenseInput, SaleInput } from "@/schemas";
import { actor, assertNotFuture, farmOid, findPig, reuseOrCreate, today, writeAudit } from "@/services/support";
import { toObjectId } from "@/lib/object-id";

export async function recordSale(ctx: FarmContext, input: SaleInput) {
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Sale date");
  const farmId = farmOid(ctx);
  const existing = input.clientTransactionId
    ? await Sale.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean()
    : null;
  if (existing) return { id: String(existing._id), totalAmount: existing.totalAmount, reused: true };

  const pigs = [];
  for (const item of input.items) {
    const pig = await findPig(ctx, item.pigId);
    if (pig.status !== "ACTIVE") {
      throw new AppError("VALIDATION_ERROR", `${pig.pigId} is not active and cannot be sold.`, 400);
    }
    pigs.push({ pig, item });
  }
  const unique = new Set(pigs.map(({ pig }) => String(pig._id)));
  if (unique.size !== pigs.length) throw new AppError("VALIDATION_ERROR", "Each pig can only appear once in a sale.", 400);

  const items = pigs.map(({ pig, item }) => ({
    pigId: pig._id,
    pigCode: pig.pigId,
    weightKg: item.weightKg ?? undefined,
    price: roundTo(item.price, 2),
  }));
  const totalAmount = roundTo(items.reduce((sum, item) => sum + item.price, 0), 2);
  const sale = await reuseOrCreate(
    async () => (input.clientTransactionId ? Sale.findOne({ farmId, clientTransactionId: input.clientTransactionId }) : null),
    () =>
      Sale.create({
        farmId,
        date: input.date,
        buyerName: input.buyerName,
        items,
        totalAmount,
        currency: ctx.farm.settings.currency,
        notes: input.notes,
        clientTransactionId: input.clientTransactionId,
        ...actor(ctx),
      }),
  );
  for (const { pig } of pigs) {
    pig.status = "SOLD";
    await pig.save();
    await HealthIncident.updateMany(
      { farmId, pigId: pig._id, status: { $in: ["OPEN", "UNDER_TREATMENT", "REFERRED"] } },
      {
        $set: { status: "CLOSED" },
        $push: { statusHistory: { status: "CLOSED", at: input.date, userId: toObjectId(ctx.userId), note: "Closed when the pig was sold." } },
      },
    );
  }
  await writeAudit(ctx, "sale.create", "Sale", String(sale._id), {
    pigs: items.map((item) => item.pigCode),
    totalAmount,
  });
  return { id: String(sale._id), totalAmount, reused: false };
}

export async function listSales(ctx: FarmContext, from?: string, to?: string) {
  const filter: Record<string, unknown> = { farmId: farmOid(ctx) };
  if (from || to) filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  const sales = await Sale.find(filter).sort({ date: -1 }).limit(100).lean();
  return sales.map((sale) => ({
    id: String(sale._id),
    date: sale.date,
    buyerName: sale.buyerName,
    pigs: sale.items.map((item) => item.pigCode).join(", "),
    totalAmount: sale.totalAmount,
    currency: sale.currency,
  }));
}

export async function recordExpense(ctx: FarmContext, input: ExpenseInput) {
  const currentDay = today(ctx);
  assertNotFuture(input.date, currentDay, "Expense date");
  const farmId = farmOid(ctx);
  const expense = await reuseOrCreate(
    async () =>
      input.clientTransactionId ? Expense.findOne({ farmId, clientTransactionId: input.clientTransactionId }).lean() : null,
    () =>
      Expense.create({
        farmId,
        date: input.date,
        category: input.category,
        amount: roundTo(input.amount, 2),
        currency: ctx.farm.settings.currency,
        description: input.description,
        payee: input.payee,
        clientTransactionId: input.clientTransactionId,
        ...actor(ctx),
      }),
  );
  await writeAudit(ctx, "expense.create", "Expense", String(expense._id), { amount: expense.amount, category: expense.category });
  return { id: String(expense._id), amount: expense.amount };
}

export async function listExpenses(ctx: FarmContext, from?: string, to?: string) {
  const filter: Record<string, unknown> = { farmId: farmOid(ctx) };
  if (from || to) filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  const expenses = await Expense.find(filter).sort({ date: -1 }).limit(100).lean();
  return expenses.map((expense) => ({
    id: String(expense._id),
    date: expense.date,
    category: expense.category,
    description: expense.description,
    payee: expense.payee ?? "",
    amount: expense.amount,
    currency: expense.currency,
  }));
}

export async function activePigSaleOptions(ctx: FarmContext) {
  const pigs = await Pig.find({ farmId: farmOid(ctx), status: "ACTIVE" }).sort({ pigId: 1 }).limit(500).lean();
  return pigs.map((pig) => ({
    value: String(pig._id),
    label: pig.pigId,
    keywords: `${pig.pigId} ${pig.category}`,
    description: pig.category,
  }));
}
