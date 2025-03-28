import { PlanError, PlanErrorCode } from "../error.ts";
import { createDockerImageExecutor } from "@/generic/resources/docker/image/executor.ts";
import type { Context } from "../types/context.ts";
import type { Plan } from "../types/plan.ts";
import { isEmpty } from "../utils/object.ts";
import {
  createRegistryDockerImageDestroyPlan,
  createRegistryDockerImagePlan,
} from "@/github/resources/registry/dockerImage/plan.ts";
import { DockerClient } from "@/generic/client/docker.ts";

export async function createGithubPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      github: githubState,
    } = {},
    config: {
      resources: {
        github: githubConfig,
      } = {},
    },
    github,
    tags,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(githubState) && isEmpty(githubConfig)) {
    return [];
  }

  if (!github) {
    throw new PlanError(
      "Github provider is required when using github resources",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const {
    username,
    accessToken,
  } = github.getCredentials();

  const {
    registry: {
      dockerImage: imagesState,
    } = {},
  } = githubState ?? {};

  const {
    registry: {
      dockerImage: imagesConfig,
    } = {},
  } = githubConfig ?? {};

  if (!isEmpty(imagesState) || !isEmpty(imagesConfig)) {
    const dockerClient = new DockerClient({
      registry: "ghcr.io",
      username,
      password: accessToken,
    }, {
      provider: "Github",
      serviceName: "ghcr",
    });

    await dockerClient.verifyInstalled();
    await dockerClient.verifyCredentials();

    const dockerExecutors = createDockerImageExecutor(dockerClient);

    plan.push(createRegistryDockerImagePlan(
      dockerExecutors,
      tags,
      imagesState,
      imagesConfig,
    ));
  }

  return (await Promise.all(plan)).flat();
}

export async function createGithubDestroyPlan(context: Context): Promise<Plan> {
  const {
    previousState: {
      github: githubState,
    } = {},
    github,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(githubState)) {
    return [];
  }

  if (!github) {
    throw new PlanError(
      "Github provider is required when using github resources",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }
  const {
    username,
    accessToken,
  } = github.getCredentials();

  const {
    registry: {
      dockerImage: imagesState,
    } = {},
  } = githubState ?? {};

  if (!isEmpty(imagesState)) {
    const dockerClient = new DockerClient({
      registry: "ghcr.io",
      username,
      password: accessToken,
    }, {
      provider: "Github",
      serviceName: "ghcr",
    });

    await dockerClient.verifyInstalled();
    await dockerClient.verifyCredentials();

    const dockerExecutors = createDockerImageExecutor(
      dockerClient,
    );
    plan.push(createRegistryDockerImageDestroyPlan(
      dockerExecutors,
      imagesState,
    ));
  }

  return (await Promise.all(plan)).flat();
}
