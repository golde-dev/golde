import { logger } from "#/logger.ts";
import { formatDuration } from "#/utils/duration.ts";
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

type TagIndex = Map<string, PackageVersion>;

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

  private async *listVersions(imageName: string): AsyncGenerator<PackageVersion> {
    const path = `${this.packagePath(imageName)}/versions`;
    for (let page = 1;; page++) {
      const versions = await this.api
        .get(path, { searchParams: { per_page: PAGE_SIZE, page } })
        .json<PackageVersion[]>();

      yield* versions;
      if (versions.length < PAGE_SIZE) {
        return;
      }
    }
  }

  private async fetchTagIndex(imageName: string): Promise<TagIndex> {
    try {
      const versions = await Array.fromAsync(this.listVersions(imageName));
      return new Map(versions.flatMap((v) => v.metadata.container.tags.map((tag) => [tag, v])));
    } catch (error) {
      throw new GithubError(
        `[GitHub] failed to list package versions for ${imageName}`,
        getFetchErrorCause(error),
      );
    }
  }

  /**
   * Listed once per package: a maxVersions cleanup deletes hundreds of tags, and GITHUB_TOKEN allows ~1000 requests an hour.
   */
  private tagIndex(imageName: string): Promise<TagIndex> {
    this.tagIndexes ??= new Map();
    return this.tagIndexes.getOrInsertComputed(imageName, () => {
      const index = this.fetchTagIndex(imageName);
      index.catch(() => this.tagIndexes?.delete(imageName));
      return index;
    });
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
    const version = index.get(tag);

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
    for (const versionTag of version.metadata.container.tags) {
      index.delete(versionTag);
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
    this.tagIndexes?.delete(imageName);
    logger.debug(
      `[GitHub][GHCR] Deleted package ${imageName} in ${formatDuration(performance.now() - start)}`,
    );
  }
}
