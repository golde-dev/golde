

import { DeployerClient } from "../clients/deployer";
import logger from "../logger";
import type { Provider } from "./provider";
import type { StateConfig} from "./state";
import { StateProvider } from "./state";

interface DeployerConfig {
  apiKey: string;
}

export class DeployerProvider implements Provider {
  private readonly project: string;
  private readonly client: DeployerClient;

  private constructor(project: string, client: DeployerClient, ) {
    this.client = client;
    this.project = project;
  }

  public static async init(project: string, { apiKey }: DeployerConfig): Promise<DeployerProvider> {
    const client = new DeployerClient(apiKey);

    try {
      await client.verifyUserToken();
      return new DeployerProvider(project, client);
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
    const {
      project,
      client,
    } = this;
    
    const stateConfig = await client.getStateConfig();
    return StateProvider.init(project, stateConfig);
  }
}
