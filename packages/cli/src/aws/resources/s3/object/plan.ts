import { createS3PlanFactory } from "../../../../generic/resources/s3/object/plan.ts";
import { s3ObjectPath } from "./path.ts";
import type { Executors } from "./executor.ts";

const {
  createObjectPlan,
  createObjectDestroyPlan,
} = createS3PlanFactory<Executors>(
  s3ObjectPath,
);

export { createObjectDestroyPlan, createObjectPlan };
