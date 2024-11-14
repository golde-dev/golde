import { logger } from "./logger.ts";
import { ContextError, ContextErrorCode } from "./error.ts";
import { createGoldeClient, getGoldeConfig } from "./golde/client/factory.ts";
import { createHCloudClient } from "./hcloud/client/factory.ts";
import type { Config } from "./types/config.ts";
import { createDockerClient } from "./docker/client/factory.ts";
import type { DockerClient } from "./docker/client/client.ts";
import { createCloudflareClient } from "./cloudflare/client/factory.ts";
import { createStateClient } from "./state/state.ts";
import type { Context } from "./types/context.ts";
import { createAWSClient } from "./aws/client/factory.ts";
import { createProjectIfMissing, createProjectIfWanted } from "./init.ts";
import { getGitInfo } from "./utils/git.ts";
import { formatDuration } from "./utils/duration.ts";
import { createSlackClient } from "./slack/client/factory.ts";

export const initializeContext = async (
  branchName: string,
  config: Config,
  yes: boolean = false,
): Promise<Context> => {
  const {
    name,
    state,
    tags,
    providers: {
      golde = getGoldeConfig(),
      aws,
      hcloud,
      cloudflare,
      docker,
      slack,
    } = {},
  } = config;

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
    const start = performance.now();
    const [
      goldeClient,
      stateClient,
      hcloudClient,
      cloudflareClient,
      awsClient,
      slackClient,
      dockerClient,
    ] = await Promise.all([
      golde ? createGoldeClient(golde) : undefined,
      state ? createStateClient(state, aws) : undefined,
      hcloud ? createHCloudClient(hcloud) : undefined,
      cloudflare ? createCloudflareClient(cloudflare) : undefined,
      aws ? createAWSClient(aws) : undefined,
      slack ? createSlackClient(slack) : undefined,
      createDocker(),
    ]);

    const git = getGitInfo(branchName);
    logger.debug("Git info", git);

    const contextBase = {
      tags,
      git,
      config,
      aws: awsClient,
      docker: dockerClient,
      golde: goldeClient,
      cloudflare: cloudflareClient,
      hcloud: hcloudClient,
      slack: slackClient,
    };

    if (goldeClient) {
      if (yes) {
        await createProjectIfMissing(goldeClient, name);
      } else {
        await createProjectIfWanted(goldeClient, name);
      }

      if (state) {
        await goldeClient.changeStateConfig(name, state);
      }
    }

    if (stateClient && state) {
      const previousState = await stateClient.getBranchState(name, branchName);

      const end = performance.now();
      logger.info(`[Context] Initialized in ${formatDuration(end - start)}`);

      return {
        ...contextBase,
        previousState,
        state: stateClient,
      };
    } else if (goldeClient) {
      const previousState = await goldeClient.getBranchState(name, branchName);

      const end = performance.now();
      logger.info(`[Context] Initialized in ${formatDuration(end - start)}`);

      return {
        ...contextBase,
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
    }
    return Deno.exit(1);
  }
};

export function getFinalContext(context: Context, config: Config): Context {
  return {
    ...context,
    config,
  };
}
