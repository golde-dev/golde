import type { Provider } from "./types.ts";
import { logger } from "../logger.ts";
import { DockerClient } from "../clients/docker.ts";

export interface DockerConfig {
  registry: string;
  username: string;
  password: string;
}

export class DockerProvider implements Provider {
  private readonly client: DockerClient;

  private constructor(client: DockerClient) {
    this.client = client;
  }

  public static async init(
    { registry, username, password }: DockerConfig,
  ): Promise<DockerProvider> {
    const docker = new DockerClient(
      registry,
      username,
      password,
    );

    try {
      await docker.verifyInstalled();
    } catch (error) {
      logger.error(
        "Failed to initialize docker",
        { error },
      );
      throw error;
    }

    try {
      await docker.verifyCredentials();
      return new DockerProvider(docker);
    } catch (error) {
      logger.error(
        "Failed to initialize docker provider, check your config",
        {
          error,
          registry,
          username: "<redacted>",
          password: "<redacted>",
        },
      );
      throw error;
    }
  }
}
