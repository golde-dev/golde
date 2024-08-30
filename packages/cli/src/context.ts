import { logger } from "./logger.ts";
import { ContextError, ContextErrorCode } from "./error.ts";
import { CloudflareProvider } from "./providers/cloudflare.ts";
import { getGoldeConfig, GoldeProvider } from "./providers/golde.ts";
import { HCloudProvider } from "./providers/hcloud.ts";
import { StateProvider } from "./providers/state.ts";
import type { Config } from "./types/config.ts";
import type { State } from "./types/state.ts";

export interface Context {
  previousConfig?: Config;
  previousState?: State;
  nextConfig: Config;
  nextState: State;
  golde?: GoldeProvider;
  state: GoldeProvider | StateProvider;
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
    },
  } = nextConfig;

  logger.debug("Start context initialization");

  try {
    const [
      goldeProvider,
      stateProvider,
      hcloudProvider,
      cloudflareProvider,
    ] = await Promise.all([
      golde ? GoldeProvider.init(name, golde) : undefined,
      state ? StateProvider.init(name, state) : undefined,
      hcloud ? HCloudProvider.init(hcloud) : undefined,
      cloudflare ? CloudflareProvider.init(cloudflare) : undefined,
    ]);

    const contextBase = {
      nextConfig,
      nextState: {},
      golde: goldeProvider,
      cloudflare: cloudflareProvider,
      hcloud: hcloudProvider,
    };

    if (stateProvider && state) {
      await goldeProvider?.registerStateProvider(state);
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
    } else if (goldeProvider) {
      const {
        config: previousConfig,
        state: previousState,
      } = await goldeProvider.getState() ?? {};

      logger.debug("Context initialized");

      return {
        ...contextBase,
        previousConfig,
        previousState,
        state: goldeProvider,
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
    }
    return Deno.exit(1);
  }
};
