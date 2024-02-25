import { ErrorCode } from "./constants/error";
import { CLIError } from "./error";
import logger from "./logger";
import { CloudflareProvider } from "./providers/cloudflare";
import { HCloudProvider } from "./providers/hcloud";
import { StateProvider } from "./providers/state";
import type { Config } from "./types/config";

export interface Context {
  config: Config
  state?: StateProvider,
  hcloud?: HCloudProvider,
  cloudflare?: CloudflareProvider,
}

export const initializeContext = async(config: Config): Promise<Context> => {
  const {
    providers: {
      state,
      hcloud,
      cloudflare,
    },
  } = config;

  logger.debug("Start context initialization");
  try {
    const [
      stateProvider,
      hcloudProvider,
      cloudflareProvider,
    ] = await Promise.all([
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

    return {
      config,
      state: stateProvider,
      cloudflare: cloudflareProvider,
      hcloud: hcloudProvider,
    };
  }
  catch (error) {
    if (error instanceof Error) {
      throw new CLIError(error.message, ErrorCode.PROVIDER_INIT_ERROR, error);
    }
    else {
      throw new CLIError("Failed to init providers", ErrorCode.PROVIDER_INIT_ERROR, error);
    }
  }
};