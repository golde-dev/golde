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

type TagIndex = Map<string, number>;

const PAGE_SIZE = 100;

export class GhcrClient extends GithubClientBase {
  private tagIndexes?: Map<string, Promise<TagIndex>>;

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

  private async fetchTagIndex(imageName: string): Promise<TagIndex> {
    const errorMessage = `[GitHub] failed to list package versions for ${imageName}`;
    const path = `${this.packagePath(imageName)}/versions`;
    const index: TagIndex = new Map();
    try {
      for (let page = 1;; page++) {
        const versions = await this.api
          .get(path, { searchParams: { per_page: PAGE_SIZE, page } })
          .json<PackageVersion[]>();

        for (const { id, metadata } of versions) {
          for (const tag of metadata.container.tags) {
            index.set(tag, id);
          }
        }
        if (versions.length < PAGE_SIZE) {
          return index;
        }
      }
    } catch (error) {
      throw new GithubError(errorMessage, getFetchErrorCause(error));
    }
  }

  /**
   * Listed once per package: a maxVersions cleanup deletes hundreds of tags, and GITHUB_TOKEN allows ~1000 requests an hour.
   */
  private tagIndex(imageName: string): Promise<TagIndex> {
    this.tagIndexes ??= new Map();
    const cached = this.tagIndexes.get(imageName);
    if (cached) {
      return cached;
    }
    const index = this.fetchTagIndex(imageName);
    this.tagIndexes.set(imageName, index);
    index.catch(() => this.tagIndexes?.delete(imageName));
    return index;
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
      return (await this.tagIndex(imageName)).has(tag);
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
    const index = await this.tagIndex(imageName);
    const id = index.get(tag);

    if (!id) {
      throw new GithubError(
        `[GitHub] package version with tag ${tag} not found for package ${imageName}`,
      );
    }

    try {
      await this.api.delete(`${this.packagePath(imageName)}/versions/${id}`);
    } catch (error) {
      throw new GithubError(errorMessage, getFetchErrorCause(error));
    }
    for (const [versionTag, versionId] of index) {
      if (versionId === id) {
        index.delete(versionTag);
      }
    }
    logger.debug(
      `[GitHub][GHCR] Deleted package version ${imageName}:${tag} (id: ${id}) in ${
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
    this.tagIndexes?.delete(imageName);
    logger.debug(
      `[GitHub][GHCR] Deleted package ${imageName} in ${formatDuration(performance.now() - start)}`,
    );
  }
}
