import { isTemplate } from "@/utils/template.ts";
import { isConfigEqual } from "@/utils/config.ts";
import { createVersionTag } from "./utils.ts";
import { findResourceDependencies } from "@/dependencies.ts";
import { logger } from "@/logger.ts";
import { Type } from "@/types/plan.ts";
import { assertBranch } from "@/utils/resource.ts";
import type { ResourceDependency } from "@/types/dependencies.ts";
import type { Tags } from "@/types/config.ts";
import type { ImageConfig, ImagesConfig, ImagesState, ImageState } from "./types.ts";
import type { GenericExecutors } from "./executor.ts";
import type {
  ChangeVersionUnit,
  CreateVersionUnit,
  DeleteVersionUnit,
  NoopUnit,
  Plan,
  UpdateVersionUnit,
} from "@/types/plan.ts";

export function createDockerImagesPlanFactory<E extends GenericExecutors>(
  dockerImagePath: (name: string) => string,
  providerName = "AWS",
  serviceName = "Registry",
) {
  function getPrevious(images: ImagesState = {}) {
    const previous: {
      [imageName: string]: {
        [version: string]: {
          imageName: string;
          isCurrent: boolean;
          config: ImageConfig;
          state: ImageState;
        };
      };
    } = {};

    for (const [imageName, { versions, current }] of Object.entries(images)) {
      for (const [version, state] of Object.entries(versions)) {
        if (!previous[imageName]) previous[imageName] = {};

        previous[imageName][version] = {
          imageName,
          config: state.config,
          isCurrent: version === current,
          state,
        };
      }
    }
    return previous;
  }

  async function getNext(
    buildDockerImage: GenericExecutors["buildDockerImage"],
    config: ImagesConfig = {},
    _tags?: Tags,
  ) {
    const next: {
      [imageName: string]: {
        imageName: string;
        version: string;
        imageId: string;
        config: ImageConfig;
        dependsOn: ResourceDependency[];
      };
    } = {};

    for (const [imageName, image] of Object.entries(config)) {
      const { versionId, imageId } = await buildDockerImage(imageName, image);

      next[imageName] = {
        imageName,
        version: versionId,
        imageId,
        config: image,
        dependsOn: findResourceDependencies(image),
      };
    }
    return next;
  }

  async function createDockerImagesPlan(
    executors: E,
    tags?: Tags,
    state?: ImagesState,
    config?: ImagesConfig,
  ): Promise<Plan> {
    const {
      buildDockerImage,
      createDockerImage,
      deleteDockerImageTag,
      updateDockerImage,
      assertCreatePermission,
      assertDeletePermission,
      assertUpdatePermission,
    } = executors;

    logger.debug({
      state,
      config,
    }, `[Plan][${providerName}] ${serviceName} docker images planning`);

    const plan: Plan = [];

    const previous = getPrevious(state);
    const next = await getNext(buildDockerImage, config, tags);

    const creating = Object.keys(next).filter((key) => !(key in previous));
    for (const key of creating) {
      const { config, imageName, imageId, version, dependsOn } = next[key];

      assertBranch(config);

      if (!isTemplate(imageName)) {
        await assertCreatePermission?.(imageName);
      }

      const createVersionUnit: CreateVersionUnit<
        ImageConfig,
        ImageState,
        typeof createDockerImage
      > = {
        type: Type.CreateVersion,
        executor: createDockerImage,
        args: [imageName, imageId, version, config],
        version,
        path: dockerImagePath(imageName),
        config,
        dependsOn,
      };
      plan.push(createVersionUnit);
    }

    const deleting = Object.keys(previous).filter((key) => !(key in next));
    for (const key of deleting) {
      const deletedValues = Object.values(previous[key]);

      for (const { imageName, state } of deletedValues) {
        const { version, config: { branch } } = state;

        if (!isTemplate(imageName)) {
          await assertDeletePermission?.(imageName);
        }
        const versionTag = createVersionTag(branch, version);
        const deleteVersionUnit: DeleteVersionUnit<ImageState, typeof deleteDockerImageTag> = {
          type: Type.DeleteVersion,
          executor: deleteDockerImageTag,
          version: state.version,
          args: [imageName, versionTag],
          path: dockerImagePath(imageName),
          state,
          dependsOn: state.dependsOn,
        };
        plan.push(deleteVersionUnit);
      }
    }

    const updating = Object.keys(previous).filter((key) => key in next);
    for (const key of updating) {
      const { version, config: nextConfig, dependsOn, imageName, imageId } = next[key];
      const previousObjectVersion = previous[key][version];
      const previousCurrent = Object.values(previous[key]).find(({ isCurrent }) => isCurrent);

      assertBranch(nextConfig);

      if (previousObjectVersion) {
        const { config: previousConfig, isCurrent, state: prevState } = previousObjectVersion;

        /**
         * If image version existed, was current and config has no changed
         */
        if (isCurrent && isConfigEqual(nextConfig, previousConfig)) {
          const noopUnit: NoopUnit<ImageConfig, ImageState> = {
            type: Type.Noop,
            path: dockerImagePath(imageName),
            config: previousConfig,
            state: prevState,
            dependsOn: dependsOn,
          };
          plan.push(noopUnit);
          continue;
        }
        /**
         * If image version existed but was not the current version and config is the same
         */
        if (!isCurrent && isConfigEqual(nextConfig, previousConfig)) {
          if (previousCurrent) {
            if (!isTemplate(imageName)) {
              await assertUpdatePermission?.(imageName);
            }

            const changeVersionUnit: ChangeVersionUnit<ImageConfig, ImageState> = {
              type: Type.ChangeVersion,
              path: dockerImagePath(name),
              config: nextConfig,
              version,
              prevVersion: previousCurrent.state.version,
              state: prevState,
              dependsOn: dependsOn,
            };
            plan.push(changeVersionUnit);
            continue;
          }
        }

        if (!isConfigEqual(nextConfig, previousConfig)) {
          const updateVersionUnit: UpdateVersionUnit<
            ImageConfig,
            ImageState,
            typeof updateDockerImage
          > = {
            type: Type.UpdateVersion,
            executor: updateDockerImage,
            args: [imageName, imageId, version, nextConfig, prevState],
            version,
            state: prevState,
            path: dockerImagePath(imageName),
            config: nextConfig,
            dependsOn,
          };
          plan.push(updateVersionUnit);
          continue;
        }
      }

      if (!isTemplate(imageName)) {
        await assertCreatePermission?.(imageName);
      }
      const createVersionUnit: CreateVersionUnit<
        ImageConfig,
        ImageState,
        typeof createDockerImage
      > = {
        type: Type.CreateVersion,
        executor: createDockerImage,
        args: [imageName, imageId, version, nextConfig],
        version,
        path: dockerImagePath(imageName),
        config: nextConfig,
        dependsOn,
      };
      plan.push(createVersionUnit);
    }

    const planWithCleanup = await addMaxVersionsCleanup(plan, previous, next, executors);
    return planWithCleanup;
  }

  async function addMaxVersionsCleanup(
    plan: Plan,
    previous: ReturnType<typeof getPrevious>,
    next: Awaited<ReturnType<typeof getNext>>,
    executors: E,
  ): Promise<Plan> {
    const cleanupUnits: Plan = [];

    for (const [name, nextEntry] of Object.entries(next)) {
      const { config } = nextEntry;
      const maxVersions = config.maxVersions;
      if (maxVersions === undefined) continue;

      const resourcePath = dockerImagePath(name);

      const planUnitsForName = plan.filter((unit) => unit.path === resourcePath);

      const versionsBeingDeleted = new Set(
        planUnitsForName
          .filter((u): u is DeleteVersionUnit<ImageState, typeof executors.deleteDockerImage> => u.type === Type.DeleteVersion)
          .map((u) => u.version),
      );

      const versionsBeingCreated = new Set(
        planUnitsForName
          .filter((u): u is CreateVersionUnit<ImageConfig, ImageState, typeof executors.createDockerImage> => u.type === Type.CreateVersion)
          .map((u) => u.version),
      );

      // Determine which version will be "current" after plan execution
      let currentVersionAfterPlan: string | undefined;

      const createVersionUnit = planUnitsForName.find(
        (u): u is CreateVersionUnit<ImageConfig, ImageState, typeof executors.createDockerImage> => u.type === Type.CreateVersion,
      );
      const changeVersionUnit = planUnitsForName.find(
        (u): u is ChangeVersionUnit<ImageConfig, ImageState> => u.type === Type.ChangeVersion,
      );

      const existingVersions = previous[name] ?? {};

      if (createVersionUnit) {
        currentVersionAfterPlan = createVersionUnit.version;
      } else if (changeVersionUnit) {
        currentVersionAfterPlan = changeVersionUnit.version;
      } else {
        const currentEntry = Object.values(existingVersions).find((v) => v.isCurrent);
        currentVersionAfterPlan = currentEntry?.state.version;
      }

      // Build projected version list from existing versions
      const projectedVersions: Array<{
        version: string;
        createdAt: string;
        isExisting: boolean;
      }> = [];

      for (const [version, entry] of Object.entries(existingVersions)) {
        if (!versionsBeingDeleted.has(version)) {
          projectedVersions.push({
            version,
            createdAt: entry.state.createdAt,
            isExisting: true,
          });
        }
      }

      // Count newly created versions (not eligible for cleanup)
      for (const version of versionsBeingCreated) {
        if (!projectedVersions.some((v) => v.version === version)) {
          projectedVersions.push({
            version,
            createdAt: new Date().toISOString(),
            isExisting: false,
          });
        }
      }

      const excessCount = projectedVersions.length - maxVersions;
      if (excessCount <= 0) continue;

      // Only delete non-current existing versions, sorted oldest first
      const deletionCandidates = projectedVersions
        .filter((v) => v.version !== currentVersionAfterPlan)
        .filter((v) => v.isExisting)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const toDelete = deletionCandidates.slice(0, excessCount);

      logger.debug({
        name,
        maxVersions,
        projectedCount: projectedVersions.length,
        deletingCount: toDelete.length,
        deletingVersions: toDelete.map((v) => v.version),
      }, `[Plan][${providerName}] ${serviceName} image ${name} maxVersions cleanup`);

      for (const candidate of toDelete) {
        const entry = existingVersions[candidate.version];
        const { state, imageName } = entry;
        const { config: { branch } } = state;
        const versionTag = createVersionTag(branch, candidate.version);

        if (!isTemplate(imageName)) {
          await executors.assertDeletePermission?.(imageName);
        }

        const deleteVersionUnit: DeleteVersionUnit<ImageState, typeof executors.deleteDockerImageTag> = {
          type: Type.DeleteVersion,
          executor: executors.deleteDockerImageTag,
          version: candidate.version,
          args: [imageName, versionTag],
          path: resourcePath,
          state,
          dependsOn: state.dependsOn,
        };
        cleanupUnits.push(deleteVersionUnit);
      }
    }

    return [...plan, ...cleanupUnits];
  }

  async function createDockerImagesDestroyPlan(
    executors: GenericExecutors,
    state?: ImagesState,
  ): Promise<Plan> {
    const {
      deleteDockerImageTag,
      assertDeletePermission,
    } = executors;

    const plan: Plan = [];
    logger.debug({
      state,
    }, `[Plan][${providerName}] ${serviceName} creating destroy images plan`);

    const previous = getPrevious(state);
    for (const key of Object.keys(previous)) {
      const imagesToDelete = Object.values(previous[key]);

      for (const { imageName, state } of imagesToDelete) {
        const { version, config: { branch } } = state;

        if (!isTemplate(imageName)) {
          await assertDeletePermission?.(imageName);
        }
        const versionTag = createVersionTag(branch, version);
        const deleteUnit: DeleteVersionUnit<ImageState, typeof deleteDockerImageTag> = {
          type: Type.DeleteVersion,
          executor: deleteDockerImageTag,
          args: [imageName, versionTag],
          version,
          path: key,
          state: state,
          dependsOn: state.dependsOn,
        };
        plan.push(deleteUnit);
      }
    }
    return plan;
  }

  return {
    createDockerImagesPlan,
    createDockerImagesDestroyPlan,
  };
}
