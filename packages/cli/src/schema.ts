import type { Config } from "./types/config";
import { CLIError } from "./error";
import { ErrorCode } from "./constants/error";
import { dnsSchema } from "./dns/schema";
import type { ZodType} from "zod";
import { z } from "zod";
import { providersSchema } from "./providers/schema";
import { bucketSchema } from "./bucket/schema";


export const schema: ZodType<Config> = z
  .object({
    project: z.string(),
    providers: providersSchema,
    dns: dnsSchema.optional(),
    buckets: bucketSchema.optional(),
  }).strict();

export function validateConfig(config: unknown): asserts config is Config {
  const result = schema.safeParse(config);
  if (!result.success) {
    throw new CLIError("Failed schema validation", ErrorCode.INVALID_CONFIG, result.error.issues);
  }
}
