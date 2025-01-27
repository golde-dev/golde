import { z } from "zod";
import { implement } from "../utils/zod.ts";
import type { GoldeClientConfig } from "./types.ts";

export const goldeCredentialsSchema = implement<GoldeClientConfig>().with({
  apiKey: z
    .string()
    .describe("Golde api key"),
}).describe("Golde provider config");
