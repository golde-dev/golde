import { logger } from "@/logger.ts";
import { PlanError, PlanErrorCode } from "@/error.ts";
import { exec } from "node:child_process";

export interface DockerInfo {
  CgroupDriver?: "systemd" | "cgroupfs";
  CgroupVersion?: string;
  ServerVersion: string;
  OSVersion: string;
  OSType: "windows" | "linux";
}

export class DockerClient {
  private readonly registry: string;
  private readonly username: string;
  private readonly password: string;
  private stage: "Plan" | "Execute";

  public constructor(registry: string, username: string, password: string) {
    this.registry = registry;
    this.username = username;
    this.password = password;
    this.stage = "Plan";
  }

  public setStage(stage: "Plan" | "Execute") {
    this.stage = stage;
  }

  public async login() {
    const {
      username,
      password,
      registry,
      stage,
    } = this;

    logger.debug(`[${stage}][Docker] Authenticating to docker registry`, {
      username,
      password: "<redacted>",
      registry,
    });

    await new Promise((resolve, reject) => {
      exec(`docker login -u ${username} -p ${password} ${registry}`, (error, _, stderr) => {
        if (error) {
          logger.error(`[${stage}][Docker] Failed to login to docker \n ${stderr}`);
          reject(
            new Error("Failed to login to docker", { cause: error }),
          );
          return;
        }
        resolve(void 0);
      });
    });
  }

  public async logout() {
    const { registry, stage } = this;

    return await new Promise((resolve, reject) => {
      exec(`docker logout ${registry}`, (error, _, stderr) => {
        if (error) {
          logger.error(`[${stage}][Docker] Failed to logout from docker \n ${stderr}`);
          reject(
            new Error("Failed to logout from docker", { cause: error }),
          );
          return;
        }
        resolve(void 0);
      });
    });
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
    const { stage } = this;
    return await new Promise((resolve, reject) => {
      exec(`docker info --format json`, (error, _, stderr) => {
        if (error) {
          logger.error(`[${stage}][Docker] Failed to run docker info \n ${stderr}`);
          reject(
            new Error("Failed to run docker info", { cause: error }),
          );
          return;
        }
        resolve(void 0);
      });
    });
  }

  public async buildImage(
    imageName: string,
    context: string = ".",
  ): Promise<string> {
    const { stage } = this;

    return await new Promise((resolve, reject) => {
      exec(`docker build ${context} --quiet`, (error, stdout, stderr) => {
        if (error) {
          logger.error(`[${stage}][Docker] Failed to build image ${imageName} \n ${stderr}`);

          reject(
            new PlanError("Failed to build image", PlanErrorCode.BUILD_ERROR, {
              cause: {
                error,
                stderr,
                stdout,
              },
            }),
          );
          return;
        }
        resolve(stdout.trim().replace("sha256:", ""));
      });
    });
  }

  public async tagImage(imageId: string, imageName: string, tag: string): Promise<void> {
    const { stage, registry } = this;

    return await new Promise((resolve, reject) => {
      exec(`docker tag ${imageId} ${registry}/${imageName}:${tag}`, (error, _, stderr) => {
        if (error) {
          logger.error(`[${stage}][Docker] Failed to tag image ${imageName} \n ${stderr}`);
          reject(
            new Error("Failed to tag image", { cause: error }),
          );
          return;
        }
        resolve(void 0);
      });
    });
  }

  public async pushImageTag(imageName: string, tag: string): Promise<void> {
    const { stage, registry } = this;

    return await new Promise((resolve, reject) => {
      exec(`docker push ${registry}/${imageName}:${tag}`, (error, _, stderr) => {
        if (error) {
          logger.error(`[${stage}][Docker] Failed to push image ${imageName} \n ${stderr}`);
          reject(
            new Error("Failed to push image", { cause: error }),
          );
          return;
        }
        resolve(void 0);
      });
    });
  }

  public async pushImage(
    imageName: string,
    imageId: string,
    tags: string[],
  ): Promise<void> {
    const { stage } = this;

    logger.debug(`[${stage}][Docker] Pushing image ${imageName}`);
    for (const tag of tags) {
      await this.tagImage(imageId, imageName, tag);
    }
    for (const tag of tags) {
      await this.pushImageTag(imageName, tag);
    }
  }

  public async removeImageTag(imageName: string, tag: string): Promise<void> {
    const { stage, registry } = this;

    return await new Promise((resolve, reject) => {
      exec(`docker rmi ${registry}/${imageName}:${tag}`, (error, _, stderr) => {
        if (error) {
          logger.error(`[${stage}][Docker] Failed to remove image ${imageName} \n ${stderr}`);
          reject(
            new Error("Failed to remove image", { cause: error }),
          );
          return;
        }
        resolve(void 0);
      });
    });
  }
}
