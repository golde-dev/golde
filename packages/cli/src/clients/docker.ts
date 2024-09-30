interface DockerInfo {
  CgroupDriver?: "systemd" | "cgroupfs";
  CgroupVersion?: string;
  ServerVersion: string;
  OSVersion: string;
  OSType: "windows" | "linux";
}

const decoder = new TextDecoder();

export class DockerClient {
  private readonly registry: string;
  private readonly username: string;
  private readonly password: string;

  public constructor(registry: string, username: string, password: string) {
    this.registry = registry;
    this.username = username;
    this.password = password;
  }

  public async verifyCredentials() {
    return true;
  }

  public async verifyInstalled() {
    try {
      const { success, stdout, stderr } = await new Deno.Command("docker", {
        args: ["info", "--format", "json"],
      }).output();

      const stdOutDecoded = decoder.decode(stdout);
      const stdErrDecoded = decoder.decode(stderr);
      if (!success) {
        throw new Error(
          `Failed to run docker info`,
          { cause: stdErrDecoded },
        );
      }
      const dockerInfo: DockerInfo = JSON.parse(stdOutDecoded);
      if (dockerInfo.OSType !== "linux") {
        throw new Error("Docker on windows is not supported");
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("No such file or directory")
      ) {
        throw new Error("Docker is not installed", { cause: error });
      } else {
        throw new Error("Failed to verify docker install", { cause: error });
      }
    }
    return true;
  }
}
