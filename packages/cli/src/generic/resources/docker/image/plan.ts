import { isTemplate } from "@/utils/template.ts";
import { isConfigEqual } from "@/utils/config.ts";
import { buildImage, createVersionTag } from "./utils.ts";
import { findResourceDependencies } from "@/dependencies.ts";
import { logger } from "@/logger.ts";
import { Type } from "@/types/plan.ts";
import { assertBranch } from "@/utils/resource.ts";
import type { ResourceDependency } from "@/types/dependencies.ts";
import type { OmitExecutionContext, WithBranch } from "@/types/config.ts";
import type { Tags } from "@/types/config.ts";
import type { ImageConfig, ImagesConfig, ImagesState, ImageState } from "./types.ts";
import type { DockerClient } from "@/generic/client/docker.ts";
import type {
  ChangeVersionUnit,
  CreateVersionUnit,
  DeleteVersionUnit,
  NoopUnit,
  Plan,
  UpdateVersionUnit,
} from "@/types/plan.ts";

export interface GenericExecutors {
  client: DockerClient;
  createDockerImage: (
    imageName: string,
    imageId: string,
    version: string,
    config: WithBranch<ImageConfig>,
  ) => Promise<OmitExecutionContext<ImageState>>;
  updateDockerImage: (
    imageName: string,
    imageId: string,
    version: string,
    config: WithBranch<ImageConfig>,
    state: ImageState,
  ) => Promise<OmitExecutionContext<ImageState>>;
  deleteDockerImage: (imageName: string, tag: string) => Promise<void>;
  assertCreatePermission?: (imageName: string) => Promise<void>;
  assertDeletePermission?: (imageName: string) => Promise<void>;
  assertUpdatePermission?: (imageName: string) => Promise<void>;
}

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

  async function getNext(client: DockerClient, config: ImagesConfig = {}, _tags?: Tags) {
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
      const { version, imageId } = await buildImage({ client, imageName, image });

      next[imageName] = {
        imageName,
        version,
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
      client,
      createDockerImage,
      deleteDockerImage,
      updateDockerImage,
      assertCreatePermission,
      assertDeletePermission,
      assertUpdatePermission,
    } = executors;

    logger.debug(`[Plan][${providerName}] ${serviceName} docker images planning`, {
      state,
      config,
    });

    const plan: Plan = [];

    const previous = getPrevious(state);
    const next = await getNext(client, config, tags);

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
        const deleteVersionUnit: DeleteVersionUnit<ImageState, typeof deleteDockerImage> = {
          type: Type.DeleteVersion,
          executor: deleteDockerImage,
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

    return await Promise.resolve(plan);
  }

  async function createDockerImagesDestroyPlan(
    executors: GenericExecutors,
    state?: ImagesState,
  ): Promise<Plan> {
    const {
      deleteDockerImage,
      assertDeletePermission,
    } = executors;

    const plan: Plan = [];
    logger.debug(`[Plan][${providerName}] ${serviceName} creating destroy images plan`, {
      state,
    });

    const previous = getPrevious(state);
    for (const key of Object.keys(previous)) {
      const imagesToDelete = Object.values(previous[key]);

      for (const { imageName, state } of imagesToDelete) {
        const { version, config: { branch } } = state;

        if (!isTemplate(imageName)) {
          await assertDeletePermission?.(imageName);
        }
        const versionTag = createVersionTag(branch, version);
        const deleteUnit: DeleteVersionUnit<ImageState, typeof deleteDockerImage> = {
          type: Type.DeleteVersion,
          executor: deleteDockerImage,
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
