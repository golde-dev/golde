

import { DeployerClient } from "../clients/deployer";
import logger from "../logger";
import type { Provider } from "./provider";
import type { StateConfig} from "./state";
import { StateProvider } from "./state";

interface DeployerConfig {
  apiKey: string
}

export class DeployerProvider implements Provider {
  private readonly client: DeployerClient;

  private constructor(client: DeployerClient) {
    this.client = client;
  }

  public static async init({ apiKey }: DeployerConfig): Promise<DeployerProvider> {
    const client = new DeployerClient(apiKey);

    try {
      await client.verifyUserToken();
      return new DeployerProvider(client);
    }
    catch (error) {
      logger.error({
        error,
        apiKey: "<redacted>",
      }, "Failed to initialize deployer provider, check your apiKey and key policy");
      throw error;
    }
  }

  /**
   * If user use custom state provider we need to register with deployer
   */
  public async registerStateProvider(stateConfig: StateConfig) {
    await this.client.registerStateConfig(stateConfig);
  } 

  /**
   * Create state provider based on s3 details provided by deployer
   */
  public async initStateProvider() {
    const stateConfig = await this.client.getStateConfig();
    return StateProvider.init(stateConfig);
  }
}
