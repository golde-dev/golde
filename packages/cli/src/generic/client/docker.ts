import { logger } from "@/logger.ts";
import { PlanError, PlanErrorCode } from "@/error.ts";
import { $ } from "execa";

export interface DockerInfo {
  CgroupDriver?: "systemd" | "cgroupfs";
  CgroupVersion?: string;
  ServerVersion: string;
  OSVersion: string;
  OSType: "windows" | "linux";
}

interface DockerOptions {
  registry: string;
  username: string;
  password: string;
}

interface ProviderInfo {
  provider: string;
  serviceName: string;
}

export class DockerClient {
  private readonly registry: string;
  private readonly username: string;
  private readonly password: string;
  private readonly provider: string;
  private readonly serviceName: string;

  public constructor(
    { registry, username, password }: DockerOptions,
    { provider, serviceName }: ProviderInfo,
  ) {
    this.registry = registry;
    this.username = username;
    this.password = password;
    this.provider = provider;
    this.serviceName = serviceName;
  }

  public getProviderInfo() {
    return {
      provider: this.provider,
      serviceName: this.serviceName,
    };
  }

  public async login() {
    const { username, password, registry } = this;

    logger.debug({
      username,
      password: "<redacted>",
      registry,
    }, `[Docker] Authenticating to docker registry`);

    try {
      await $({ input: password })`docker login -u ${username} --password-stdin ${registry}`;
    } catch (error) {
      logger.error(`[Docker] Failed to login to ${registry}`);
      throw new Error(`Failed to login to ${registry}`, { cause: error });
    }
  }

  public async logout() {
    const { registry } = this;

    try {
      await $`docker logout ${registry}`;
    } catch (error) {
      logger.error(`[Docker] Failed to logout from docker`);
      throw new Error("Failed to logout from docker", { cause: error });
    }
  }

  public async verifyCredentials() {
    try {
      await this.login();
      await this.logout();
    } catch {
      throw new Error(`Unable to authenticate with registry: ${this.registry}`);
    }
  }

  public async verifyInstalled() {
    try {
      await $`docker info --format json`;
    } catch (error) {
      logger.error(`[Docker] Failed to run docker info`);
      throw new Error("Failed to run docker info", { cause: error });
    }
  }

  public async buildImage(
    imageName: string,
    context: string = ".",
    dockerfile: string = "Dockerfile",
  ): Promise<string> {
    try {
      const { stdout } = await $`docker build ${context} -f ${dockerfile} --quiet`;
      return stdout.trim().replace("sha256:", "");
    } catch (error) {
      logger.error(`[Docker] Failed to build image ${imageName}`);
      throw new PlanError("Failed to build image", PlanErrorCode.BUILD_ERROR, { cause: error });
    }
  }

  public async tagImage(imageId: string, imageName: string, tag: string): Promise<void> {
    const { registry } = this;

    try {
      await $`docker tag ${imageId} ${registry}/${imageName}:${tag}`;
    } catch (error) {
      logger.error(`[Docker] Failed to tag image ${imageName}`);
      throw new Error("Failed to tag image", { cause: error });
    }
  }

  public async pushImageTag(imageName: string, tag: string): Promise<void> {
    const { registry } = this;

    try {
      await $`docker push ${registry}/${imageName}:${tag}`;
    } catch (error) {
      logger.error(`[Docker] Failed to push image ${imageName}`);
      throw new Error("Failed to push image", { cause: error });
    }
  }

  public async pushImage(
    imageName: string,
    imageId: string,
    tags: string[],
  ): Promise<void> {
    logger.debug(`[Docker] Pushing image ${imageName}`);
    for (const tag of tags) {
      await this.tagImage(imageId, imageName, tag);
    }
    for (const tag of tags) {
      await this.pushImageTag(imageName, tag);
    }
  }

  public async removeImageTag(imageName: string, tag: string): Promise<void> {
    const { registry } = this;

    try {
      await $`docker rmi ${registry}/${imageName}:${tag}`;
    } catch (error) {
      logger.error(`[Docker] Failed to remove image ${imageName}`);
      throw new Error("Failed to remove image", { cause: error });
    }
  }
}
