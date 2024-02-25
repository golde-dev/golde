import { CloudflareClient } from "../clients/cloudflare";
import logger from "../logger";
import type { Provider } from "./provider";

interface CloudflareConfig {
  apiKey: string
}

export class CloudflareProvider implements Provider {
  private readonly client: CloudflareClient;

  private constructor(client: CloudflareClient) {
    this.client = client;
  }

  public static async init({ apiKey }: CloudflareConfig): Promise<CloudflareProvider> {
    const client = new CloudflareClient(apiKey);

    try {
      logger.debug("Initializing cloudflare provider");
      await client.verifyUserToken();
      return new CloudflareProvider(client);
    }
    catch (error) {
      logger.error({
        error,
        apiKey: "<redacted>",
      }, "Failed to initialize cloudflare provider, check your apiKey and key policy");
      throw error;
    }
  }
}

