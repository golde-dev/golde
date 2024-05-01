import type { Context } from "./context.ts";
import type { Plan } from "./types/plan.ts";

export function applyPlan(_: Context, plan: Plan): void {
  for (const unit of plan) {
    console.log(`Applying ${unit.type} ${unit.path}`);
  }
}
