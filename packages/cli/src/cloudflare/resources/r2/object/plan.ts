import type { Executors } from "@/aws/resources/s3/object/executor.ts";
import { createS3PlanFactory } from "@/generic/resources/s3/object/plan.ts";
import { r2ObjectPath, r2VersionObjectPath } from "./path.ts";

const {
  createObjectPlan,
  createObjectDestroyPlan,
} = createS3PlanFactory<Executors>(
  r2ObjectPath,
  r2VersionObjectPath,
  "Cloudflare",
  "R2",
);

export { createObjectDestroyPlan, createObjectPlan };
