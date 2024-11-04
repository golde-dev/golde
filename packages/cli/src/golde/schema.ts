import { z } from "zod";
import { implement } from "../utils/zod.ts";
import type { GoldeCredentials } from "./types.ts";

export const goldeCredentialsSchema = implement<GoldeCredentials>().with({
  apiKey: z
    .string()
    .describe("Golde api key"),
}).describe("Golde provider config");
