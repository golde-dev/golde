import { createS3PlanFactory } from "../../../../generic/resources/s3/object/plan.ts";
import { s3ObjectPath } from "./path.ts";
import type { Executors } from "./executor.ts";

const {
  createObjectsPlan,
  createObjectsDestroyPlan,
} = createS3PlanFactory<Executors>(
  s3ObjectPath,
  "AWS",
  "S3",
);

export {
  createObjectsDestroyPlan as createS3ObjectsDestroyPlan,
  createObjectsPlan as createS3ObjectsPlan,
};
