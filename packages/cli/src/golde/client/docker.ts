import { GoldeClientBase, GoldeError, notFoundAsUndefined } from "@/golde/client/base.ts";
import { logger } from "@/logger.ts";
import type { ContainerConfig } from "../resources/docker/container/types.ts";

interface Container {
  createdAt: string;
  updatedAt?: string;
}

/**
 * Docker client for docker services managed by Golde
 */
export class DockerClient extends GoldeClientBase {
  public async createDockerContainer(
    name: string,
    config: ContainerConfig,
  ): Promise<Container> {
    logger.debug({ name, config }, "[Golde] creating docker container");
    try {
      const container = await this.makeRequest<Container>(
        `/docker/containers`,
        "POST",
        { name, config },
      );
      return container;
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error(e.cause, "[Golde] Failed to create docker container");
      }
      throw e;
    }
  }

  public async updateDockerContainer(
    name: string,
    config: ContainerConfig,
  ): Promise<Container> {
    logger.debug({ name, config }, "[Golde] updating docker container");
    try {
      const container = await this.makeRequest<Container>(
        `/docker/containers/${name}`,
        "PUT",
        { config },
      );
      return container;
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error(e.cause, "[Golde] Failed to update docker container");
      }
      throw e;
    }
  }

  public async deleteDockerContainer(
    name: string,
  ): Promise<void> {
    logger.debug({ name }, "[Golde] deleting docker container");
    try {
      await this.makeRequest<void>(
        `/docker/containers/${name}`,
        "DELETE",
      );
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error(e.cause, "[Golde] Failed to delete docker container");
      }
      throw e;
    }
  }

  public async hasContainer(name: string): Promise<boolean> {
    logger.debug({ name }, "[Golde] fetching docker container");
    try {
      const container = await notFoundAsUndefined(this.makeRequest<Container>(
        `/docker/containers/${name}`,
        "GET",
      ));
      return Boolean(container);
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error(e.cause, "[Golde] Failed to get docker container");
      }
      throw e;
    }
  }
}
