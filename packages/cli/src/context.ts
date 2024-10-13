import { logger } from "./logger.ts";
import { ContextError, ContextErrorCode } from "./error.ts";
import { createGoldeClient, getGoldeConfig } from "./providers/golde.ts";
import { createHCloudClient } from "./providers/hcloud.ts";
import type { Config } from "./types/config.ts";
import type { State, StateClient } from "./types/state.ts";
import { createDockerClient } from "./providers/docker.ts";
import type { GitInfo } from "./clients/git.ts";
import { createGitClient } from "./providers/git.ts";
import type { DockerClient } from "./clients/docker.ts";
import type { GoldeClient } from "./clients/golde.ts";
import type { CloudflareClient } from "./clients/cloudflare.ts";
import type { HCloudClient } from "./clients/hcloud.ts";
import { createCloudflareClient } from "./providers/cloudflare.ts";
import { createStateClient } from "./state/state.ts";

export interface Context {
  previousConfig?: Config;
  previousState?: State;
  nextConfig: Config;
  nextState: State;

  git: GitInfo;
  state: StateClient;
  docker?: DockerClient;
  golde?: GoldeClient;
  hcloud?: HCloudClient;
  cloudflare?: CloudflareClient;
}

export const initializeContext = async (
  nextConfig: Config,
): Promise<Context> => {
  const {
    name,
    state,
    providers: {
      golde = getGoldeConfig(),
      hcloud,
      cloudflare,
      docker,
    } = {},
  } = nextConfig;

  logger.debug("Start context initialization");

  const createDocker = async (): Promise<DockerClient | undefined> => {
    if (docker) {
      logger.debug("Using docker provider to create docker client");
      return await createDockerClient(docker);
    } else if (golde) {
      logger.debug("Using golde provider to create docker client");
      return await createDockerClient(golde);
    }
    logger.debug("No docker client initialized");
  };

  try {
    const [
      goldeClient,
      stateClient,
      hcloudClient,
      cloudflareClient,
      dockerClient,
      gitClient,
    ] = await Promise.all([
      golde ? createGoldeClient(golde) : undefined,
      state ? createStateClient(state) : undefined,
      hcloud ? createHCloudClient(hcloud) : undefined,
      cloudflare ? createCloudflareClient(cloudflare) : undefined,
      createDocker(),
      createGitClient(),
    ]);

    const git = gitClient.getGitInfo();
    logger.debug("Git info", git);

    const contextBase = {
      git,
      nextConfig,
      nextState: {},
      docker: dockerClient,
      golde: goldeClient,
      cloudflare: cloudflareClient,
      hcloud: hcloudClient,
    };

    if (stateClient && state) {
      await goldeClient?.changeStateConfig(name, state);
      logger.debug("Using own state provider");

      const {
        config: previousConfig,
        state: previousState,
      } = await stateClient.getState(name) ?? {};

      logger.info("Context initialized");

      return {
        ...contextBase,
        previousConfig,
        previousState,
        state: stateClient,
      };
    } else if (goldeClient) {
      const {
        config: previousConfig,
        state: previousState,
      } = await goldeClient.getState(name) ?? {};

      logger.info("Context initialized");

      return {
        ...contextBase,
        previousConfig,
        previousState,
        state: goldeClient,
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
