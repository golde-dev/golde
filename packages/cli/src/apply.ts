import type { Context } from "./context";
import type { Plan } from "./types/plan";


export function applyPlan(context: Context, plan: Plan): void {
  for (const unit of plan) {
    console.log(`Applying ${unit.type} ${unit.path}`);
  }
}