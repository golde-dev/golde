import type { AWSClient } from "../client/client.ts";
import type { Tags } from "../../types/config.ts";
import type { Plan } from "../../types/plan.ts";
import type { Route53Config, Route53State } from "./types.ts";

export const createRoute53Executors = (_aws: AWSClient) => {
  return {};
};

export type Executors = ReturnType<typeof createRoute53Executors>;

export async function createRoute53Plan(
  _executors: Executors,
  _tags?: Tags,
  _state?: Route53State,
  _config?: Route53Config,
): Promise<Plan> {
  return await Promise.resolve([]);
}
