import { z } from "zod";
import type { ImageFunctionConfig, ZipFunctionConfig } from "./types.ts";
import { implement } from "../../utils/zod.ts";
import { branchPatternSchema, branchSchema, transformBranch } from "../../utils/resource.ts";

const runtimeSchema = z.enum([
  "nodejs20.x",
  "nodejs18.x",
  "nodejs14.x",
  "python3.13",
  "python3.12",
  "python3.11",
  "python3.10",
  "python3.9",
  "java21",
  "java17",
  "java11",
  "java8.al2",
  "dotnet8",
  "dotnet6",
  "ruby3.3",
  "ruby3.2",
  "provided.al2023",
  "provided.al2",
]);

const zipCodeSchema = z.union([
  z.object({
    zipFile: z.instanceof(Uint8Array),
  }),
  z.object({
    s3Bucket: z.string().min(1),
    s3Key: z.string().min(1),
    s3ObjectVersion: z.string().optional(),
  }),
]);

const imageCodeSchema = z.object({
  imageUri: z.string().url(),
});

export const zipFunctionSchema = implement<ZipFunctionConfig>().with({
  packageType: z.literal("Zip"),
  branch: branchSchema,
  branchPattern: branchPatternSchema,
  code: zipCodeSchema,
  runtime: runtimeSchema,
  handler: z.string(),
  roleArn: z.string(),
  timeout: z.number().optional(),
  memorySize: z.number().optional(),
  description: z.string().optional(),
  region: z.string().optional(),
  tags: z.record(z.string()).optional(),
})
  .strict()
  .transform(transformBranch);

export const imageFunctionSchema = implement<ImageFunctionConfig>().with({
  packageType: z.literal("Image"),
  branch: branchSchema,
  branchPattern: branchPatternSchema,
  code: imageCodeSchema,
  roleArn: z.string(),
  timeout: z.number().optional(),
  memorySize: z.number().optional(),
  description: z.string().optional(),
  region: z.string().optional(),
  tags: z.record(z.string()).optional(),
})
  .strict()
  .transform(transformBranch);

export const functionSchema = z.union([
  imageFunctionSchema,
  zipFunctionSchema,
]);

const functionNameSchema = z
  .string()
  .min(1, { message: "Function name must be at least 1 character long" })
  .max(64, { message: "Function name must be at most 64 characters long" })
  .regex(/^[A-Za-z0-9_-]+$/, {
    message: "Function name can only contain letters, numbers, hyphens (-), and underscores (_)",
  });

export const lambdaFunctionSchema = z.record(functionNameSchema, functionSchema);
