import { CloudflareClient } from "../clients/cloudflare.ts";
import { logger } from "../logger.ts";
import type { Provider } from "./types.ts";

interface CloudflareConfig {
  apiToken: string;
  accountId: string;
}

export class CloudflareProvider implements Provider {
  private readonly client: CloudflareClient;

  private constructor(client: CloudflareClient) {
    this.client = client;
  }

  /**
   * Initialize cloudflare provider and verify user token
   */
  public static async init(
    { apiToken, accountId }: CloudflareConfig,
  ): Promise<CloudflareProvider> {
    const client = new CloudflareClient(apiToken, accountId);

    try {
      logger.debug("Initializing cloudflare provider");
      await client.verifyUserToken();
      return new CloudflareProvider(client);
    } catch (error) {
      logger.error(
        "Failed to initialize cloudflare provider, check your apiKey and key policy",
        {
          error,
          apiKey: "<redacted>",
        },
      );
      throw error;
    }
  }

  /**
   * Getter Cloudflare client
   */
  public getClient = () => this.client;
}
