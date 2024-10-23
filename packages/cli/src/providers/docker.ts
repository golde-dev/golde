import { logger } from "../logger.ts";
import { DockerClient } from "../clients/docker.ts";
import type { DockerConfig, GoldeConfig } from "./types.ts";

export async function createDockerClient(
  config: DockerConfig | GoldeConfig,
): Promise<DockerClient> {
  if ("apiKey" in config) {
    logger.warn("Golde docker registry not implemented");
    return {} as DockerClient;
  }
  const {
    registry,
    username,
    password,
  } = config as DockerConfig;

  const docker = new DockerClient(
    registry,
    username,
    password,
  );

  try {
    logger.debug("Verifying docker installation");
    await docker.verifyInstalled();
  } catch (error) {
    logger.error(
      "Failed to initialize docker",
      { error },
    );
    throw error;
  }

  try {
    logger.debug("Verifying docker credentials");
    await docker.verifyCredentials();
    return docker;
  } catch (error) {
    logger.error(
      "Failed to initialize docker, check your config",
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
