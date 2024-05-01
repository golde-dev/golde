import { logger } from "./logger.ts";
import { ContextError, ContextErrorCode } from "./error.ts";
import { CloudflareProvider } from "./providers/cloudflare.ts";
import { DeployerProvider, getDeployerConfig } from "./providers/deployer.ts";
import { HCloudProvider } from "./providers/hcloud.ts";
import { StateProvider } from "./providers/state.ts";
import type { Config } from "./types/config.ts";
import type { State } from "./types/state.ts";

export interface Context {
  previousConfig?: Config;
  previousState?: State;
  nextConfig: Config;
  nextState: State;
  deployer?: DeployerProvider;
  state: DeployerProvider | StateProvider;
  hcloud?: HCloudProvider;
  cloudflare?: CloudflareProvider;
}

export const initializeContext = async (
  nextConfig: Config,
): Promise<Context> => {
  const {
    name,
    providers: {
      deployer = getDeployerConfig(),
      state,
      hcloud,
      cloudflare,
    },
  } = nextConfig;

  logger.debug("Start context initialization");

  try {
    const [
      deployerProvider,
      stateProvider,
      hcloudProvider,
      cloudflareProvider,
    ] = await Promise.all([
      deployer ? DeployerProvider.init(name, deployer) : undefined,
      state ? StateProvider.init(name, state) : undefined,
      hcloud ? HCloudProvider.init(hcloud) : undefined,
      cloudflare ? CloudflareProvider.init(cloudflare) : undefined,
    ]);

    const contextBase = {
      nextConfig,
      nextState: {},
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
      } = await stateProvider.getState() ?? {};

      logger.debug("Context initialized");

      return {
        ...contextBase,
        previousConfig,
        previousState,
        state: stateProvider,
      };
    } else if (deployerProvider) {
      const {
        config: previousConfig,
        state: previousState,
      } = await deployerProvider.getState() ?? {};

      logger.debug("Context initialized");

      return {
        ...contextBase,
        previousConfig,
        previousState,
        state: deployerProvider,
      };
    } else {
      throw new ContextError(
        "Missing deployer or state config",
        ContextErrorCode.STATE_OR_DEPLOYER_MISSING,
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Providers initialization failed: ${error.message}`);
    }
    return Deno.exit(1);
  }
};
