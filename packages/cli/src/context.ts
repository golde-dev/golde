import { logger } from "./logger.ts";
import { ConfigErrorCode, ContextError, ContextErrorCode } from "./error.ts";
import { createGoldeClient, getGoldeConfig } from "./golde/client/factory.ts";
import { createHCloudClient } from "./hcloud/client/factory.ts";
import { createCloudflareClient } from "./cloudflare/client/factory.ts";
import { createStateClient } from "./state/state.ts";
import { createAWSClient } from "./aws/client/factory.ts";
import { createProjectIfMissing, createProjectIfWanted } from "./init.ts";
import { getGitInfo } from "./utils/git.ts";
import { formatDuration } from "./utils/duration.ts";
import { createSlackClient } from "./slack/client/factory.ts";
import type { Context } from "./types/context.ts";
import type { Config } from "./types/config.ts";
import { createGithubClient } from "./github/client/factory.ts";
import type { SavedResource } from "@/types/dependencies.ts";
import { resolveConfigState } from "@/utils/template.ts";
import { ConfigError } from "@/error.ts";
import { resourcesToState } from "@/utils/state.ts";

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
      github,
      slack,
    } = {},
  } = config;

  logger.debug("[Context] Start context initialization");

  try {
    const start = performance.now();
    const [
      goldeClient,
      stateClient,
      hcloudClient,
      cloudflareClient,
      awsClient,
      slackClient,
      githubClient,
    ] = await Promise.all([
      golde ? createGoldeClient(golde) : undefined,
      state ? createStateClient(state, aws) : undefined,
      hcloud ? createHCloudClient(hcloud) : undefined,
      cloudflare ? createCloudflareClient(cloudflare) : undefined,
      aws ? createAWSClient(aws) : undefined,
      slack ? createSlackClient(slack) : undefined,
      github ? createGithubClient(github) : undefined,
    ]);

    const git = getGitInfo(branchName);
    logger.debug("Git info", git);

    const contextBase = {
      tags,
      git,
      config,
      aws: awsClient,
      github: githubClient,
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
      const previousResources = await stateClient.getBranchResources(name, branchName);

      const end = performance.now();
      logger.info(`[Context] Initialized in ${formatDuration(end - start)}`);

      return {
        ...contextBase,
        previousResources: previousResources,
        previousState: resourcesToState(previousResources),
        state: stateClient,
      };
    } else if (goldeClient) {
      const previousResources = await goldeClient.getBranchResources(name, branchName);

      const end = performance.now();
      logger.info(`[Context] Initialized in ${formatDuration(end - start)}`);

      return {
        ...contextBase,
        previousResources: previousResources,
        previousState: resourcesToState(previousResources),
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
      logger.error(`[Context] Providers initialization failed: ${error.message}`);
    }
    return Deno.exit(1);
  }
};

export function getFinalContext(context: Context, external: SavedResource[]): Context {
  const {
    config,
    previousResources,
  } = context;

  try {
    const configWithExternal = resolveConfigState(config, external);
    const configWithState = resolveConfigState(configWithExternal, previousResources);

    return {
      ...context,
      config: configWithState,
    };
  } catch (error) {
    if (error instanceof ConfigError) {
      switch (error.code) {
        case ConfigErrorCode.INVALID_CONFIG:
          logger.error("[Context] Config failed validation", error.cause);
          break;
        default:
          logger.error(`[Context] Configuration error: ${error.message}`);
      }
    } else if (error instanceof Error) {
      logger.error(`[Context] Unknown error: ${error.message}`, error);
    }
    return Deno.exit(1);
  }
}
