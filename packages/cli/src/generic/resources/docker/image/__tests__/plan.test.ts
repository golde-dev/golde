import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "@/types/plan.ts";
import { createDockerImagesPlanFactory } from "../plan.ts";
import { createVersionTag } from "../utils.ts";
import type { GenericExecutors } from "../executor.ts";
import type { ImageConfig, ImagesConfig, ImagesState, ImageState } from "../types.ts";
import type { WithBranch } from "@/types/config.ts";
import type {
  CreateVersionUnit,
  DeleteVersionUnit,
} from "@/types/plan.ts";

const dockerImagePath = (name: string) => `github.registry.dockerImage.${name}`;

const { createDockerImagesPlan } = createDockerImagesPlanFactory<GenericExecutors>(
  dockerImagePath,
  "GitHub",
  "Registry",
);

let buildVersionCounter = 0;

function createExecutors(): GenericExecutors {
  return {
    buildDockerImage: spy((_imageName: string, _config: ImageConfig) =>
      Promise.resolve({
        imageId: `sha256:new-image-${++buildVersionCounter}`,
        versionId: `new-version-${buildVersionCounter}`,
      })
    ),
    createDockerImage: spy((_imageName: string, _imageId: string, _version: string, _config: WithBranch<ImageConfig>) =>
      Promise.resolve({
        version: "new-version",
        imageId: "sha256:new-image",
        createdAt: "2026-01-01T00:00:00.000Z",
        config: {} as WithBranch<ImageConfig>,
      })
    ),
    updateDockerImage: spy((_imageName: string, _imageId: string, _version: string, _config: WithBranch<ImageConfig>, _state: ImageState) =>
      Promise.resolve({
        version: "new-version",
        imageId: "sha256:new-image",
        createdAt: "2026-01-01T00:00:00.000Z",
        config: {} as WithBranch<ImageConfig>,
      })
    ),
    deleteDockerImage: spy(() => Promise.resolve()),
    deleteDockerImageTag: spy(() => Promise.resolve()),
    assertCreatePermission: spy(() => Promise.resolve()),
    assertDeletePermission: spy(() => Promise.resolve()),
    assertUpdatePermission: spy(() => Promise.resolve()),
  } as GenericExecutors;
}

function makeImageState(
  version: string,
  createdAt: string,
  overrides: Partial<ImageConfig> = {},
): ImageState {
  return {
    version,
    imageId: `sha256:img-${version}`,
    createdAt,
    dependsOn: [],
    config: {
      version: "ImageHash",
      branch: "master",
      ...overrides,
    } as WithBranch<ImageConfig>,
  };
}

function makeImagesState(
  name: string,
  current: string,
  versions: Record<string, ImageState>,
): ImagesState {
  return {
    [name]: {
      current,
      versions,
    },
  };
}

describe("docker image maxVersions", () => {

  describe("maxVersions cleanup in plan", () => {
    it("should not cleanup when maxVersions is undefined", async () => {
      const executors = createExecutors();
      const v1State = makeImageState("v1", "2025-01-01T00:00:00.000Z");
      const v2State = makeImageState("v2", "2025-06-01T00:00:00.000Z");
      const v3State = makeImageState("v3", "2025-12-01T00:00:00.000Z");

      const state = makeImagesState("my-app", "v3", {
        v1: v1State,
        v2: v2State,
        v3: v3State,
      });

      const config: ImagesConfig = {
        "my-app": {
          version: "ImageHash",
          branch: "master",
        },
      };

      const plan = await createDockerImagesPlan(executors, undefined, state, config);
      const deleteVersionUnits = plan.filter((u) => u.type === Type.DeleteVersion);
      expect(deleteVersionUnits.length).toBe(0);
    });

    it("should not cleanup when versions are under the limit", async () => {
      const executors = createExecutors();
      const v1State = makeImageState("v1", "2025-01-01T00:00:00.000Z");

      const state = makeImagesState("my-app", "v1", {
        v1: v1State,
      });

      const config: ImagesConfig = {
        "my-app": {
          version: "ImageHash",
          branch: "master",
          maxVersions: 3,
        },
      };

      const plan = await createDockerImagesPlan(executors, undefined, state, config);
      const deleteVersionUnits = plan.filter((u) => u.type === Type.DeleteVersion);
      expect(deleteVersionUnits.length).toBe(0);
    });

    it("should delete oldest version when maxVersions: 2 with 3 versions after CreateVersion", async () => {
      const executors = createExecutors();
      const v1State = makeImageState("v1", "2025-01-01T00:00:00.000Z");
      const v2State = makeImageState("v2", "2025-06-01T00:00:00.000Z");

      const state = makeImagesState("my-app", "v2", {
        v1: v1State,
        v2: v2State,
      });

      const config: ImagesConfig = {
        "my-app": {
          version: "ImageHash",
          branch: "master",
          maxVersions: 2,
        },
      };

      const plan = await createDockerImagesPlan(executors, undefined, state, config);

      const createVersionUnits = plan.filter((u) => u.type === Type.CreateVersion);
      expect(createVersionUnits.length).toBe(1);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ImageState, typeof executors.deleteDockerImageTag> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(1);
      expect(deleteVersionUnits[0].version).toBe("v1");
      expect(deleteVersionUnits[0].path).toBe("github.registry.dockerImage.my-app");
    });

    it("should delete 2 oldest versions when maxVersions: 1 with 3 versions after CreateVersion", async () => {
      const executors = createExecutors();
      const v1State = makeImageState("v1", "2025-01-01T00:00:00.000Z");
      const v2State = makeImageState("v2", "2025-06-01T00:00:00.000Z");
      const v3State = makeImageState("v3", "2025-12-01T00:00:00.000Z");

      const state = makeImagesState("my-app", "v3", {
        v1: v1State,
        v2: v2State,
        v3: v3State,
      });

      const config: ImagesConfig = {
        "my-app": {
          version: "ImageHash",
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createDockerImagesPlan(executors, undefined, state, config);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ImageState, typeof executors.deleteDockerImageTag> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(3);

      const deletedVersions = deleteVersionUnits.map((u) => u.version);
      expect(deletedVersions).toContain("v1");
      expect(deletedVersions).toContain("v2");
      expect(deletedVersions).toContain("v3");
    });

    it("should never delete the current version", async () => {
      const executors = createExecutors();
      const v1State = makeImageState("v1", "2025-01-01T00:00:00.000Z");
      const v2State = makeImageState("v2", "2025-06-01T00:00:00.000Z");

      const state = makeImagesState("my-app", "v2", {
        v1: v1State,
        v2: v2State,
      });

      const config: ImagesConfig = {
        "my-app": {
          version: "ImageHash",
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createDockerImagesPlan(executors, undefined, state, config);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ImageState, typeof executors.deleteDockerImageTag> => u.type === Type.DeleteVersion,
      );

      for (const unit of deleteVersionUnits) {
        const createVersionUnit = plan.find(
          (u) => u.type === Type.CreateVersion,
        ) as CreateVersionUnit<ImageConfig, ImageState, typeof executors.createDockerImage>;
        expect(unit.version).not.toBe(createVersionUnit.version);
      }
    });

    it("should not cleanup when creating first version with maxVersions set", async () => {
      const executors = createExecutors();
      const state: ImagesState = {};

      const config: ImagesConfig = {
        "my-app": {
          version: "ImageHash",
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createDockerImagesPlan(executors, undefined, state, config);

      const createVersionUnits = plan.filter((u) => u.type === Type.CreateVersion);
      expect(createVersionUnits.length).toBe(1);

      const deleteVersionUnits = plan.filter((u) => u.type === Type.DeleteVersion);
      expect(deleteVersionUnits.length).toBe(0);
    });

    it("should delete oldest when maxVersions: 1 with 2 versions", async () => {
      const executors = createExecutors();
      const v1State = makeImageState("v1", "2025-01-01T00:00:00.000Z");
      const v2State = makeImageState("v2", "2025-06-01T00:00:00.000Z");

      const state = makeImagesState("my-app", "v2", {
        v1: v1State,
        v2: v2State,
      });

      const config: ImagesConfig = {
        "my-app": {
          version: "ImageHash",
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createDockerImagesPlan(executors, undefined, state, config);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ImageState, typeof executors.deleteDockerImageTag> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(2);
      expect(deleteVersionUnits[0].version).toBe("v1");
      expect(deleteVersionUnits[1].version).toBe("v2");
    });

    it("should use correct versionTag format in delete args", async () => {
      const executors = createExecutors();
      const v1State = makeImageState("v1", "2025-01-01T00:00:00.000Z");
      const v2State = makeImageState("v2", "2025-06-01T00:00:00.000Z");

      const state = makeImagesState("my-app", "v2", {
        v1: v1State,
        v2: v2State,
      });

      const config: ImagesConfig = {
        "my-app": {
          version: "ImageHash",
          branch: "master",
          maxVersions: 2,
        },
      };

      const plan = await createDockerImagesPlan(executors, undefined, state, config);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ImageState, typeof executors.deleteDockerImageTag> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(1);
      expect(deleteVersionUnits[0].version).toBe("v1");

      // Verify the args use createVersionTag format: [imageName, versionTag]
      const expectedTag = createVersionTag("master", "v1");
      expect(deleteVersionUnits[0].args).toEqual(["my-app", expectedTag]);
    });

    it("should cleanup excess versions on noop", async () => {
      const executors = createExecutors();

      // Build returns a specific versionId — set it up so it matches an existing version
      const matchingVersion = "existing-hash";
      executors.buildDockerImage = spy(() =>
        Promise.resolve({
          imageId: "sha256:existing",
          versionId: matchingVersion,
        })
      );

      const v1State = makeImageState("v1", "2025-01-01T00:00:00.000Z");
      const currentState = makeImageState(matchingVersion, "2025-06-01T00:00:00.000Z", {
        maxVersions: 1,
      });

      const state = makeImagesState("my-app", matchingVersion, {
        v1: v1State,
        [matchingVersion]: currentState,
      });

      const config: ImagesConfig = {
        "my-app": {
          version: "ImageHash",
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createDockerImagesPlan(executors, undefined, state, config);

      const noopUnits = plan.filter((u) => u.type === Type.Noop);
      expect(noopUnits.length).toBe(1);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ImageState, typeof executors.deleteDockerImageTag> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(1);
      expect(deleteVersionUnits[0].version).toBe("v1");
    });
  });
});
