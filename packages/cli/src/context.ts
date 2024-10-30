import { logger } from "./logger.ts";
import { ContextError, ContextErrorCode } from "./error.ts";
import { createGoldeClient, getGoldeConfig } from "./providers/golde.ts";
import { createHCloudClient } from "./providers/hcloud.ts";
import type { Config } from "./types/config.ts";
import { createDockerClient } from "./providers/docker.ts";
import { createGitClient } from "./providers/git.ts";
import type { DockerClient } from "./clients/docker.ts";
import { createCloudflareClient } from "./providers/cloudflare.ts";
import { createStateClient } from "./state/state.ts";
import type { Context } from "./types/context.ts";
import { createAWSClient } from "./providers/aws.ts";
import { createProjectIfMissing, createProjectIfWanted } from "./init.ts";

export const initializeContext = async (
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
    const [
      goldeClient,
      stateClient,
      hcloudClient,
      cloudflareClient,
      awsClient,
      dockerClient,
      gitClient,
    ] = await Promise.all([
      golde ? createGoldeClient(golde) : undefined,
      state ? createStateClient(state, aws) : undefined,
      hcloud ? createHCloudClient(hcloud) : undefined,
      cloudflare ? createCloudflareClient(cloudflare) : undefined,
      aws ? createAWSClient(aws) : undefined,
      createDocker(),
      createGitClient(),
    ]);

    const git = gitClient.getGitInfo();
    logger.debug("Git info", git);

    const {
      branchName,
    } = git;

    const contextBase = {
      tags,
      git,
      config,
      aws: awsClient,
      docker: dockerClient,
      golde: goldeClient,
      cloudflare: cloudflareClient,
      hcloud: hcloudClient,
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

      logger.info("Context initialized");

      return {
        ...contextBase,
        previousState,
        state: stateClient,
      };
    } else if (goldeClient) {
      const previousState = await goldeClient.getBranchState(name, branchName);

      logger.info("Context initialized");

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
