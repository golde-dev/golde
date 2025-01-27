import { join } from "@std/path";
import { logger } from "../../logger.ts";
import { GoldeClient } from "./client.ts";
import { homedir } from "node:os";
import { existsSync } from "@std/fs/exists";
import { readJSON } from "../../utils/fs.ts";
import type { GoldeClientConfig } from "../types.ts";

export const getGoldeConfig = (): GoldeClientConfig | void => {
  const apiKey = Deno.env.get("GOLDE_API_KEY");
  if (apiKey) {
    return {
      apiKey,
    };
  }
  const configPath = join(homedir(), ".golde/config.json")
  if (existsSync(configPath)) {
    try {
      return readJSON<GoldeClientConfig>(configPath);
    } catch {
      logger.error("Failed to read golde apiKey from config, run `golde auth`");
      Deno.exit(1);
    }
  }
};

export async function createGoldeClient(
  config: GoldeClientConfig,
): Promise<GoldeClient> {
  const client = new GoldeClient(config);

  try {
    await client.verifyUserToken();
    return client;
  } catch (error) {
    logger.error(
      "Failed to initialize golde client, check your apiKey",
      {
        error,
        apiKey: "<redacted>",
      },
    );
    throw error;
  }
}
