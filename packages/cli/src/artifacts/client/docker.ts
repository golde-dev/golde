import { decode } from "../../utils/text.ts";

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

  public constructor(registry: string, username: string, password: string) {
    this.registry = registry;
    this.username = username;
    this.password = password;
  }

  public async login() {
    const {
      username,
      password,
      registry,
    } = this;

    return await new Deno.Command("docker", {
      args: ["login", "-u", username, "-p", password, registry],
    }).output();
  }

  public async logout() {
    const { registry } = this;
    return await new Deno.Command("docker", {
      args: ["logout", registry],
    }).output();
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
      const { success, stderr } = await new Deno.Command("docker", {
        args: ["info", "--format", "json"],
      }).output();

      const stdErrDecoded = decode(stderr);
      if (!success) {
        throw new Error(
          `Failed to run docker info`,
          { cause: stdErrDecoded },
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("No such file or directory")) {
          throw new Error("Docker is not installed", { cause: error });
        }
      }
      throw new Error("Failed to verify docker install", { cause: error });
    }
  }

  public async buildImage(imageName: string, tags: string): Promise<void> {
    try {
      await new Deno.Command("docker", {
        args: ["build", "-t", imageName, "-t", tags, "."],
      });
    } catch (error) {
      throw new Error("Failed to build image", { cause: error });
    }
  }

  public async pushImage(imageName: string, tags: string): Promise<void> {
    try {
      await new Deno.Command("docker", {
        args: ["image", "push", "-t", imageName, "-t", tags, "."],
      });
    } catch (error) {
      throw new Error("Failed to push image", { cause: error });
    }
  }
}
