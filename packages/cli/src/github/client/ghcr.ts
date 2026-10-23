import { logger } from "@/logger.ts";
import { formatDuration } from "@/utils/duration.ts";
import { getErrorStatus, getFetchErrorCause, GithubClientBase, GithubError } from "./base.ts";

interface PackageVersion {
  id: number;
  name: string;
  metadata: {
    container: {
      tags: string[];
    };
  };
}

const PAGE_SIZE = 100;

export class GhcrClient extends GithubClientBase {
  /**
   * Image names are `<owner>/<package>`; packages of other owners are reachable only through their org.
   */
  private packagePath(imageName: string): string {
    const [owner, ...rest] = imageName.split("/");
    if (!owner || rest.length === 0) {
      throw new GithubError(`[GitHub] image name ${imageName} is not in <owner>/<package> form`);
    }
    const scope = owner.toLowerCase() === this.username.toLowerCase() ? "user" : `orgs/${owner}`;
    return `${scope}/packages/container/${encodeURIComponent(rest.join("/"))}`;
  }

  private async findPackageVersion(
    imageName: string,
    tag: string,
  ): Promise<PackageVersion | undefined> {
    const errorMessage = `[GitHub] failed to list package versions for ${imageName}`;
    const path = `${this.packagePath(imageName)}/versions`;
    try {
      for (let page = 1;; page++) {
        const versions = await this.api
          .get(path, { searchParams: { per_page: PAGE_SIZE, page } })
          .json<PackageVersion[]>();
          
        const version = versions.find((v) => v.metadata.container.tags.includes(tag));
        if (version || versions.length < PAGE_SIZE) {
          return version;
        }
      }
    } catch (error) {
      throw new GithubError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async packageExists(imageName: string): Promise<boolean> {
    const path = this.packagePath(imageName);
    try {
      await this.api.get(path);
      return true;
    } catch (error) {
      if (getFetchErrorCause(error)?.status === 404) {
        return false;
      }
      throw new GithubError(
        `[GitHub] failed to get package ${imageName}`,
        getFetchErrorCause(error),
      );
    }
  }

  public async packageVersionExists(
    imageName: string,
    tag: string,
  ): Promise<boolean> {
    try {
      return Boolean(await this.findPackageVersion(imageName, tag));
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        return false;
      }
      throw error;
    }
  }

  public async deletePackageVersion(
    imageName: string,
    tag: string,
  ): Promise<void> {
    const errorMessage = `[GitHub] failed to delete package version ${imageName}:${tag}`;
    const start = performance.now();
    const version = await this.findPackageVersion(imageName, tag);

    if (!version) {
      throw new GithubError(
        `[GitHub] package version with tag ${tag} not found for package ${imageName}`,
      );
    }

    try {
      await this.api.delete(`${this.packagePath(imageName)}/versions/${version.id}`);
    } catch (error) {
      throw new GithubError(errorMessage, getFetchErrorCause(error));
    }
    logger.debug(
      `[GitHub][GHCR] Deleted package version ${imageName}:${tag} (id: ${version.id}) in ${
        formatDuration(performance.now() - start)
      }`,
    );
  }

  public async deletePackage(imageName: string): Promise<void> {
    const errorMessage = `[GitHub] failed to delete package ${imageName}`;
    const path = this.packagePath(imageName);
    const start = performance.now();
    try {
      await this.api.delete(path);
    } catch (error) {
      throw new GithubError(errorMessage, getFetchErrorCause(error));
    }
    logger.debug(
      `[GitHub][GHCR] Deleted package ${imageName} in ${formatDuration(performance.now() - start)}`,
    );
  }
}
