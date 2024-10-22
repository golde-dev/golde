import type { Context } from "./types/context.ts";
import type { Dependencies } from "./types/dependencies.ts";
import type { Plan } from "./types/plan.ts";


export function getDependencies(context: Context, plan: Plan): Promise<Dependencies> {
  return Promise.resolve({});
}
