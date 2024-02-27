import logger from "./logger";
import { ErrorCode } from "./constants/error";
import { CLIError } from "./error";
import { CloudflareProvider } from "./providers/cloudflare";
import { DeployerProvider } from "./providers/deployer";
import { HCloudProvider } from "./providers/hcloud";
import { StateProvider } from "./providers/state";
import type { Config } from "./types/config";

export interface Context {
  config: Config
  previousConfig?: Config
  deployer?: DeployerProvider,
  state: StateProvider,
  hcloud?: HCloudProvider,
  cloudflare?: CloudflareProvider,
}

export const initializeContext = async(config: Config): Promise<Context> => {
  const {
    providers: {
      deployer,
      state,
      hcloud,
      cloudflare,
    },
  } = config;

  logger.debug("Start context initialization");

  try {
    const [
      deployerProvider,
      stateProvider,
      hcloudProvider,
      cloudflareProvider,
    ] = await Promise.all([
      deployer
        ? DeployerProvider.init(deployer)
        : undefined,
      state
        ? StateProvider.init(state)
        : undefined,
      hcloud
        ? HCloudProvider.init(hcloud)
        : undefined,
      cloudflare
        ? CloudflareProvider.init(cloudflare)
        : undefined,
    ]);

    const contextBase = {
      config,
      deployer: deployerProvider,
      cloudflare: cloudflareProvider,
      hcloud: hcloudProvider,
    };
    
    if (stateProvider && state) {
      await deployerProvider?.registerStateProvider(state);
      logger.debug("Using own state provider");

      const previousConfig = await stateProvider.getPreviousConfig();

      return {
        ...contextBase,
        previousConfig,
        state: stateProvider,
      };
    }
    else if (deployerProvider) {
      const stateProviderFromDeployer = await deployerProvider.initStateProvider();
      logger.debug("Created state provider from deployer");
      
      const previousConfig = await stateProviderFromDeployer.getPreviousConfig();

      return {
        ...contextBase,
        previousConfig,
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