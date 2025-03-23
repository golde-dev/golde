import { input } from "@inquirer/prompts";
import { writeJSON } from "./utils/json.ts";
import { homedir } from "node:os";
import { GoldeClient } from "./golde/client/client.ts";
import { logger } from "./logger.ts";
import type { GoldeClientConfig } from "./golde/types.ts";
import { exit } from "node:process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export async function configure() {
  const apiKey = await input({
    message: "Golde API Key: ",
    validate: (value: string) => value.length >= 32,
  });

  const config: GoldeClientConfig = {
    apiKey,
  };

  try {
    const client = new GoldeClient(config);
    await client.verifyUserToken();
  } catch {
    logger.error("[Configure] Failed to verify API key, check your apiKey");
    exit(1);
  }

  const configPath = join(homedir(), ".golde/config.json");
  mkdirSync(dirname(configPath), { recursive: true });

  writeJSON(
    configPath,
    {
      apiKey,
    },
  );
}
