import { logger } from "@/logger.ts";
import { formatDuration } from "@/utils/duration.ts";
import type { GithubClientBase } from "./base.ts";

interface PackageVersion {
  id: number;
  name: string;
  metadata: {
    container: {
      tags: string[];
    };
  };
}

export class GhcrClient {
  private get api() {
    return this as unknown as GithubClientBase;
  }

  async listPackageVersions(
    packageName: string,
  ): Promise<PackageVersion[]> {
    const encodedName = encodeURIComponent(packageName);
    return await this.api["makeRequest"]<PackageVersion[]>(
      `/user/packages/container/${encodedName}/versions`,
    );
  }

  async deletePackageVersion(
    packageName: string,
    tag: string,
  ): Promise<void> {
    const start = performance.now();
    const versions = await this.listPackageVersions(packageName);
    const version = versions.find((v) =>
      v.metadata.container.tags.includes(tag)
    );

    if (!version) {
      throw new Error(
        `Version with tag ${tag} not found for package ${packageName}`,
      );
    }

    const encodedName = encodeURIComponent(packageName);
    await this.api["makeRequest"]<null>(
      `/user/packages/container/${encodedName}/versions/${version.id}`,
      "DELETE",
    );
    const end = performance.now();
    logger.debug(
      `[GitHub][GHCR] Deleted package version ${packageName}:${tag} (id: ${version.id}) in ${formatDuration(end - start)}`,
    );
  }

  async deletePackage(packageName: string): Promise<void> {
    const start = performance.now();
    const encodedName = encodeURIComponent(packageName);
    await this.api["makeRequest"]<null>(
      `/user/packages/container/${encodedName}`,
      "DELETE",
    );
    const end = performance.now();
    logger.debug(
      `[GitHub][GHCR] Deleted package ${packageName} in ${formatDuration(end - start)}`,
    );
  }
}
