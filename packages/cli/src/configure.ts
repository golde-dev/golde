import { input } from "@inquirer/prompts";
import { writeJSON } from "./utils/fs.ts";
import { homedir } from "node:os";
import { dirname, join } from "@std/path";
import { GoldeClient } from "./golde/client/client.ts";
import { logger } from "./logger.ts";
import type { GoldeClientConfig } from "./golde/types.ts";


export async function configure() {
  const apiKey = await input({
    message: 'Golde API Key: ',
    validate: (value: string) => value.length >= 32
  });
  
  const config: GoldeClientConfig = {
    apiKey,
  }
  
  try {
    const client = new GoldeClient(config);
    await client.verifyUserToken();
  } catch {
    logger.error("[Configure] Failed to verify API key, check your apiKey");
    Deno.exit(1);
  }

  const configPath = join(homedir(), ".golde/config.json")
  Deno.mkdirSync(dirname(configPath), {recursive: true})
  
  writeJSON(
    configPath, 
    {
      apiKey,
    }
  )
}
