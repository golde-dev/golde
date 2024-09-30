import { logger } from "./logger.ts";
import { ContextError, ContextErrorCode } from "./error.ts";
import { CloudflareProvider } from "./providers/cloudflare.ts";
import { getGoldeConfig, GoldeProvider } from "./providers/golde.ts";
import { HCloudProvider } from "./providers/hcloud.ts";
import { StateProvider } from "./providers/state.ts";
import type { Config } from "./types/config.ts";
import type { State, StateClient } from "./types/state.ts";
import { DockerProvider } from "./providers/docker.ts";

export interface Context {
  previousConfig?: Config;
  previousState?: State;
  nextConfig: Config;
  nextState: State;

  docker?: DockerProvider;
  golde?: GoldeProvider;
  state: StateClient;
  hcloud?: HCloudProvider;
  cloudflare?: CloudflareProvider;
}

export const initializeContext = async (
  nextConfig: Config,
): Promise<Context> => {
  const {
    name,
    providers: {
      golde = getGoldeConfig(),
      state,
      hcloud,
      cloudflare,
      docker,
    },
  } = nextConfig;

  logger.debug("Start context initialization");

  try {
    const [
      goldeProvider,
      dockerProvider,
      stateProvider,
      hcloudProvider,
      cloudflareProvider,
    ] = await Promise.all([
      golde ? GoldeProvider.init(golde) : undefined,
      docker ? DockerProvider.init(docker) : undefined,
      state ? StateProvider.init(state) : undefined,
      hcloud ? HCloudProvider.init(hcloud) : undefined,
      cloudflare ? CloudflareProvider.init(cloudflare) : undefined,
    ]);

    const contextBase = {
      nextConfig,
      nextState: {},
      golde: goldeProvider,
      docker: dockerProvider,
      cloudflare: cloudflareProvider,
      hcloud: hcloudProvider,
    };

    if (stateProvider && state) {
      await goldeProvider?.getClient().changeStateConfig(name, state);
      logger.debug("Using own state provider");

      const {
        config: previousConfig,
        state: previousState,
      } = await stateProvider.getClient().getState(name) ?? {};

      logger.info("Context initialized");

      return {
        ...contextBase,
        previousConfig,
        previousState,
        state: stateProvider.getClient(),
      };
    } else if (goldeProvider) {
      const {
        config: previousConfig,
        state: previousState,
      } = await goldeProvider.getClient().getState(name) ?? {};

      logger.info("Context initialized");

      return {
        ...contextBase,
        previousConfig,
        previousState,
        state: goldeProvider.getClient(),
      };
    } else {
      throw new ContextError(
        "Missing golde or state config",
        ContextErrorCode.STATE_OR_GOLDE_MISSING,
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Providers initialization failed: ${error.message}`);
      logger.debug("Error details", error);
    }
    return Deno.exit(1);
  }
};
