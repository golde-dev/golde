import { HCloudClient } from "../clients/hcloud";
import logger from "../logger";
import type { Provider } from "./provider";

interface HCloudConfig {
  apiKey: string
}

export class HCloudProvider implements Provider {
  private readonly client: HCloudClient;

  private constructor(client: HCloudClient) {
    this.client = client;
  }

  public static async init({ apiKey }: HCloudConfig): Promise<HCloudProvider> {
    const client = new HCloudClient(apiKey);

    try {
      await client.verifyUserToken();
      return new HCloudProvider(client);
    }
    catch (error) {
      logger.error({
        error,
        apiKey: "<redacted>",
      }, "Failed to initialize HCloud provider, check your apiKey and key policy");
      throw error;
    }
  }
}

