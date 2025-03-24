import { createS3PlanFactory } from "@/generic/resources/s3/object/plan.ts";
import type { GenericExecutors } from "@/generic/resources/s3/object/executor.ts";
import { r2ObjectPath } from "./path.ts";

const {
  createObjectsPlan,
  createObjectsDestroyPlan,
} = createS3PlanFactory<GenericExecutors>(
  r2ObjectPath,
  "Cloudflare",
  "R2",
);

export {
  createObjectsDestroyPlan as createR2ObjectsDestroyPlan,
  createObjectsPlan as createR2ObjectsPlan,
};
