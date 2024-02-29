import logger from "./logger";
import { ErrorCode } from "./constants/error";
import { CLIError } from "./error";
import { CloudflareProvider } from "./providers/cloudflare";
import { DeployerProvider } from "./providers/deployer";
import { HCloudProvider } from "./providers/hcloud";
import { StateProvider } from "./providers/state";
import type { Config } from "./types/config";
import type { State } from "./types/state";

export interface Context {
  previousConfig?: Config
  previousState?: State;
  currentConfig: Config;
  currentState: State
  deployer?: DeployerProvider,
  state: StateProvider,
  hcloud?: HCloudProvider,
  cloudflare?: CloudflareProvider,
}

export const initializeContext = async(currentConfig: Config): Promise<Context> => {
  const {
    project,
    providers: {
      deployer,
      state,
      hcloud,
      cloudflare,
    },
  } = currentConfig;

  logger.debug("Start context initialization");

  try {
    const [
      deployerProvider,
      stateProvider,
      hcloudProvider,
      cloudflareProvider,
    ] = await Promise.all([
      deployer
        ? DeployerProvider.init(project, deployer)
        : undefined,
      state
        ? StateProvider.init(project, state)
        : undefined,
      hcloud
        ? HCloudProvider.init(hcloud)
        : undefined,
      cloudflare
        ? CloudflareProvider.init(cloudflare)
        : undefined,
    ]);

    const contextBase = {
      currentConfig,
      currentState: {},
      deployer: deployerProvider,
      cloudflare: cloudflareProvider,
      hcloud: hcloudProvider,
    };
    
    if (stateProvider && state) {
      await deployerProvider?.registerStateProvider(state);
      logger.debug("Using own state provider");

      const {
        config: previousConfig,
        state: previousState,
      } = await stateProvider.getPreviousConfig() ?? {};

      return {
        ...contextBase,
        previousConfig,
        previousState,
        state: stateProvider,
      };
    }
    else if (deployerProvider) {
      const stateProviderFromDeployer = await deployerProvider.initStateProvider();
      logger.debug("Created state provider from deployer");
      
      const {
        config: previousConfig,
        state: previousState,
      } = await stateProviderFromDeployer.getPreviousConfig() ?? {};

      return {
        ...contextBase,
        previousConfig,
        previousState,
        state: stateProviderFromDeployer,
      };
    }
    else {
      throw new CLIError("Missing deployer or state config", ErrorCode.STATE_OR_DEPLOYER_MISSING);
    }
  }
  catch (error) {
    if (error instanceof Error) {
      throw new CLIError(error.message, ErrorCode.PROVIDER_INIT_ERROR, error);
    }
    throw error;
  }
};