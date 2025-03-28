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
    logger.debug("[Golde] creating docker container", { name, config });
    try {
      const container = await this.makeRequest<Container>(
        `/docker/containers`,
        "POST",
        { name, config },
      );
      return container;
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("[Golde] Failed to create docker container", e.cause);
      }
      throw e;
    }
  }

  public async updateDockerContainer(
    name: string,
    config: ContainerConfig,
  ): Promise<Container> {
    logger.debug("[Golde] updating docker container", { name, config });
    try {
      const container = await this.makeRequest<Container>(
        `/docker/containers/${name}`,
        "PUT",
        { config },
      );
      return container;
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("[Golde] Failed to update docker container", e.cause);
      }
      throw e;
    }
  }

  public async deleteDockerContainer(
    name: string,
  ): Promise<void> {
    logger.debug("[Golde] deleting docker container", { name });
    try {
      await this.makeRequest<void>(
        `/docker/containers/${name}`,
        "DELETE",
      );
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("[Golde] Failed to delete docker container", e.cause);
      }
      throw e;
    }
  }

  public async hasContainer(name: string): Promise<boolean> {
    logger.debug("[Golde] fetching docker container", { name });
    try {
      const container = await notFoundAsUndefined(this.makeRequest<Container>(
        `/docker/containers/${name}`,
        "GET",
      ));
      return Boolean(container);
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("[Golde] Failed to get docker container", e.cause);
      }
      throw e;
    }
  }
}
