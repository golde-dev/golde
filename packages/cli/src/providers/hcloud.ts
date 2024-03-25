import { HCloudClient } from "../clients/hcloud";
import logger from "../logger";
import type { HCloudServerConfig, HCloudServerState } from "../servers/types";
import type { Provider } from "./types";

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
      logger.error(
        "Failed to initialize HCloud provider, check your apiKey and key policy",
        {
          error,
          apiKey: "<redacted>",
        } 
      );
      throw error;
    }
  }

  public async createServer(config: HCloudServerConfig): Promise<HCloudServerState> {
    // @ts-expect-error TODO: fix this
    const result = await this.client.createServer(config);
    return {
      id: result.server.id,
    };
  }
}

