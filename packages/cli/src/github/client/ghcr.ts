import { logger } from "@/logger.ts";
import { formatDuration } from "@/utils/duration.ts";
import {
  getErrorStatus,
  getFetchErrorCause,
  GithubClientBase,
  GithubError,
} from "./base.ts";

interface PackageVersion {
  id: number;
  name: string;
  metadata: {
    container: {
      tags: string[];
    };
  };
}

export class GhcrClient extends GithubClientBase {
  public async listPackageVersions(packageName: string): Promise<PackageVersion[]> {
    const errorMessage = `[GitHub] failed to list package versions for ${packageName}`;
    const encodedName = encodeURIComponent(packageName);
    try {
      return await this.api
        .get(`user/packages/container/${encodedName}/versions`)
        .json<PackageVersion[]>();
    } catch (error) {
      throw new GithubError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async packageExists(packageName: string): Promise<boolean> {
    try {
      await this.listPackageVersions(packageName);
      return true;
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        return false;
      }
      throw error;
    }
  }

  public async packageVersionExists(
    packageName: string,
    tag: string,
  ): Promise<boolean> {
    try {
      const versions = await this.listPackageVersions(packageName);
      return versions.some((v) => v.metadata.container.tags.includes(tag));
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        return false;
      }
      throw error;
    }
  }

  public async deletePackageVersion(
    packageName: string,
    tag: string,
  ): Promise<void> {
    const errorMessage = `[GitHub] failed to delete package version ${packageName}:${tag}`;
    const start = performance.now();
    const versions = await this.listPackageVersions(packageName);
    const version = versions.find((v) => v.metadata.container.tags.includes(tag));

    if (!version) {
      throw new GithubError(
        `[GitHub] package version with tag ${tag} not found for package ${packageName}`,
      );
    }

    const encodedName = encodeURIComponent(packageName);
    try {
      await this.api.delete(
        `user/packages/container/${encodedName}/versions/${version.id}`,
      );
    } catch (error) {
      throw new GithubError(errorMessage, getFetchErrorCause(error));
    }
    logger.debug(
      `[GitHub][GHCR] Deleted package version ${packageName}:${tag} (id: ${version.id}) in ${
        formatDuration(performance.now() - start)
      }`,
    );
  }

  public async deletePackage(packageName: string): Promise<void> {
    const errorMessage = `[GitHub] failed to delete package ${packageName}`;
    const start = performance.now();
    const encodedName = encodeURIComponent(packageName);
    try {
      await this.api.delete(`user/packages/container/${encodedName}`);
    } catch (error) {
      throw new GithubError(errorMessage, getFetchErrorCause(error));
    }
    logger.debug(
      `[GitHub][GHCR] Deleted package ${packageName} in ${
        formatDuration(performance.now() - start)
      }`,
    );
  }
}
