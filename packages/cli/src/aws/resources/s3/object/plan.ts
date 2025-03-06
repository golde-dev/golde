import { createS3PlanFactory } from "../../../../generic/resources/s3/object/plan.ts";
import { s3ObjectPath, s3VersionObjectPath } from "./path.ts";
import type { Executors } from "./executor.ts";

const {
  createS3ObjectPlan,
  createS3ObjectDestroyPlan,
} = createS3PlanFactory<Executors>(
  s3ObjectPath,
  s3VersionObjectPath,
);

export { createS3ObjectDestroyPlan, createS3ObjectPlan };
