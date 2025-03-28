import type { Tags } from "@/types/config.ts";
import type { ContainersConfig, ContainersState } from "./types.ts";
import type { Executors } from "./executor.ts";
import type { Plan } from "@/types/plan.ts";

export async function createDockerContainerPlan(
  _executors: Executors,
  _tags?: Tags,
  _containersState?: ContainersState,
  _containersConfig?: ContainersConfig,
): Promise<Plan> {
  return await Promise.resolve([]);
}

export async function createDockerContainerDestroyPlan(
  _executors: Executors,
  _containersState?: ContainersState,
): Promise<Plan> {
  return await Promise.resolve([]);
}
