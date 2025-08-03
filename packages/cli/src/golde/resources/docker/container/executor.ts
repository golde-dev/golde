import type { GoldeClient } from "@/golde/client/client.ts";
import type { ContainerConfig, ContainerState } from "./types.ts";
import type { OmitExecutionContext, WithBranch } from "@/types/config.ts";
import { PlanError, PlanErrorCode } from "@/error.ts";
import { logger } from "@/logger.ts";

export function createDockerContainerExecutors(golde: GoldeClient) {
  async function createContainer(
    name: string,
    config: WithBranch<ContainerConfig>,
  ): Promise<OmitExecutionContext<ContainerState>> {
    const {
      createdAt,
    } = await golde.createDockerContainer(name, config);

    logger.debug({ name, config }, "[Execute][Golde] Created docker container");

    return {
      createdAt,
      config,
    };
  }

  async function updateContainer(
    name: string,
    config: WithBranch<ContainerConfig>,
    state: ContainerState,
  ): Promise<OmitExecutionContext<ContainerState>> {
    const {
      updatedAt,
    } = await golde.updateDockerContainer(name, config);

    logger.debug({ name, config }, "[Execute][Golde] Updated docker container");

    return {
      ...state,
      updatedAt,
      config,
    };
  }

  async function deleteContainer(
    name: string,
  ): Promise<void> {
    await golde.deleteDockerContainer(name);
    logger.debug({ name }, "[Execute][Golde] Deleted docker container");
  }

  async function assertContainerNameAvailable(name: string) {
    if (await golde.hasContainer(name)) {
      throw new PlanError(
        `Docker container ${name} already exists`,
        PlanErrorCode.RESOURCE_EXISTS,
      );
    }
  }

  return {
    assertContainerNameAvailable,
    createContainer,
    updateContainer,
    deleteContainer,
  };
}

export type Executors = ReturnType<typeof createDockerContainerExecutors>;
