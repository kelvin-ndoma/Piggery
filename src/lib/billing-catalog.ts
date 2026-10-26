import { BILLING_PLAN_CATALOG, type BillingCycle, type BillingPlan } from "@/types/domain";

export function catalogAmount(plan: BillingPlan, cycle: BillingCycle): number {
  const item = BILLING_PLAN_CATALOG.find((entry) => entry.plan === plan);
  if (!item || item.quoted) return 0;
  return cycle === "YEARLY" ? item.yearly : item.monthly;
}

export function catalogLabel(plan: string): string {
  const item = BILLING_PLAN_CATALOG.find((entry) => entry.plan === plan);
  return item?.name ?? plan;
}
