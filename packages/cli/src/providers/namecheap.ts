import { NameCheapClient } from "../clients/namecheap";
import logger from "../logger";
import type { Provider } from "./provider";

interface NameCheapConfig {
  apiKey: string;
  apiUser: string
}

export class NameCheapProvider implements Provider {
  private readonly client: NameCheapClient;

  private constructor(client: NameCheapClient) {
    this.client = client;
  }

  public static async init({ apiKey, apiUser }: NameCheapConfig): Promise<NameCheapProvider> {
    const client = new NameCheapClient(apiKey, apiUser);

    try {
      await client.verifyUserToken();
      return new NameCheapProvider(client);
    }
    catch (error) {
      logger.error({
        error,
        apiKey: "<redacted>",
      }, "Failed to initialize Namecheap provider, check your apiKey, apiUser");
      throw error;
    }
  }
}

