import type { Context } from "./context.ts";
import type { Plan } from "./types/plan.ts";

export async function applyPlan(_: Context, plan: Plan): Promise<void> {
  for (const unit of plan) {
    console.log(`Applying ${unit.type} ${unit.path}`);
    await unit.executor(unit.args);
  }
}
