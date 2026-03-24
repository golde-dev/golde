import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { spy } from "@std/testing/mock";
import { Type } from "@/types/plan.ts";
import { createS3PlanFactory } from "../plan.ts";
import { createObjectKey } from "../utils.ts";
import type { GenericExecutors } from "../executor.ts";
import type { ObjectConfig, ObjectsConfig, ObjectsState, ObjectState } from "../types.ts";
import type { WithBranch } from "@/types/config.ts";
import type {
  CreateVersionUnit,
  DeleteVersionUnit,
} from "@/types/plan.ts";

const s3ObjectPath = (name: string) => `aws.s3.object.${name}`;

const { createObjectsPlan } = createS3PlanFactory<GenericExecutors>(
  s3ObjectPath,
  "AWS",
  "S3",
);

function createExecutors(): GenericExecutors {
  return {
    createObject: spy(() => Promise.resolve({
      key: "test-key",
      version: "new-version",
      createdAt: "2026-01-01T00:00:00.000Z",
      config: {} as WithBranch<ObjectConfig>,
    })),
    updateObject: spy(() => Promise.resolve({
      key: "test-key",
      version: "new-version",
      createdAt: "2026-01-01T00:00:00.000Z",
      config: {} as WithBranch<ObjectConfig>,
    })),
    deleteObject: spy(() => Promise.resolve()),
    assertCreatePermission: spy(() => Promise.resolve()),
    assertDeletePermission: spy(() => Promise.resolve()),
    assertUpdatePermission: spy(() => Promise.resolve()),
    assertObjectExist: spy(() => Promise.resolve()),
  } as GenericExecutors;
}

function makeObjectState(
  version: string,
  name: string,
  bucketName: string,
  createdAt: string,
  overrides: Partial<ObjectConfig> = {},
): ObjectState {
  return {
    key: createObjectKey(version, name),
    version,
    createdAt,
    dependsOn: [],
    config: {
      bucketName,
      source: "test.txt",
      context: FIXTURE_DIR,
      branch: "master",
      ...overrides,
    } as WithBranch<ObjectConfig>,
  };
}

function makeObjectsState(
  name: string,
  current: string,
  versions: Record<string, ObjectState>,
): ObjectsState {
  return {
    [name]: {
      current,
      versions,
    },
  };
}

// The plan factory calls createObject from utils.ts which does filesystem operations.
// To test maxVersions cleanup logic, we create scenarios where:
// - For "updating" paths: previous state has versions with known hashes, and config source
//   points to a real file whose hash differs (triggering CreateVersion)
// - For noop: the version hash in state matches what createObject would compute
//
// Since we can't easily stub createObject, we use a fixture file and accept that
// the test will compute a real hash. The maxVersions cleanup logic operates on the
// plan and previous state, which we fully control via the state fixture data.

const FIXTURE_DIR = `${import.meta.dirname}/__fixtures__`;

describe("s3 object maxVersions", () => {
  describe("schema validation", () => {
    it("should reject maxVersions: 0", async () => {
      const { objectConfigSchema } = await import("../schema.ts");
      const result = objectConfigSchema.safeParse({
        bucketName: "test-bucket",
        source: "./test.txt",
        branch: "master",
        maxVersions: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject fractional maxVersions", async () => {
      const { objectConfigSchema } = await import("../schema.ts");
      const result = objectConfigSchema.safeParse({
        bucketName: "test-bucket",
        source: "./test.txt",
        branch: "master",
        maxVersions: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("should accept maxVersions: 1", async () => {
      const { objectConfigSchema } = await import("../schema.ts");
      const result = objectConfigSchema.safeParse({
        bucketName: "test-bucket",
        source: "./test.txt",
        branch: "master",
        maxVersions: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("maxVersions cleanup in plan", () => {
    it("should not cleanup when maxVersions is undefined", async () => {
      const executors = createExecutors();
      const v1State = makeObjectState("v1", "app.tar.gz", "my-bucket", "2025-01-01T00:00:00.000Z");
      const v2State = makeObjectState("v2", "app.tar.gz", "my-bucket", "2025-06-01T00:00:00.000Z");
      const v3State = makeObjectState("v3", "app.tar.gz", "my-bucket", "2025-12-01T00:00:00.000Z");

      const state = makeObjectsState("app.tar.gz", "v3", {
        v1: v1State,
        v2: v2State,
        v3: v3State,
      });

      // Config WITHOUT maxVersions, source pointing to fixture
      const config: ObjectsConfig = {
        "app.tar.gz": {
          bucketName: "my-bucket",
          source: "test.txt",
          context: FIXTURE_DIR,
          branch: "master",
        },
      };

      const plan = await createObjectsPlan(executors, undefined, state, config);

      // Should have a CreateVersion (new hash from fixture) but NO cleanup DeleteVersion
      const deleteVersionUnits = plan.filter((u) => u.type === Type.DeleteVersion);
      expect(deleteVersionUnits.length).toBe(0);
    });

    it("should not cleanup when versions are under the limit", async () => {
      const executors = createExecutors();
      const v1State = makeObjectState("v1", "app.tar.gz", "my-bucket", "2025-01-01T00:00:00.000Z");

      const state = makeObjectsState("app.tar.gz", "v1", {
        v1: v1State,
      });

      // maxVersions: 3 with only 1 existing + 1 being created = 2 total
      const config: ObjectsConfig = {
        "app.tar.gz": {
          bucketName: "my-bucket",
          source: "test.txt",
          context: FIXTURE_DIR,
          branch: "master",
          maxVersions: 3,
        },
      };

      const plan = await createObjectsPlan(executors, undefined, state, config);
      const deleteVersionUnits = plan.filter((u) => u.type === Type.DeleteVersion);
      expect(deleteVersionUnits.length).toBe(0);
    });

    it("should delete oldest version when maxVersions: 2 with 3 versions after CreateVersion", async () => {
      const executors = createExecutors();
      const v1State = makeObjectState("v1", "app.tar.gz", "my-bucket", "2025-01-01T00:00:00.000Z");
      const v2State = makeObjectState("v2", "app.tar.gz", "my-bucket", "2025-06-01T00:00:00.000Z");

      const state = makeObjectsState("app.tar.gz", "v2", {
        v1: v1State,
        v2: v2State,
      });

      // New version will be created (hash from fixture won't match v1 or v2)
      // Projected: v1, v2, <new> = 3 versions. maxVersions: 2 → delete v1 (oldest)
      const config: ObjectsConfig = {
        "app.tar.gz": {
          bucketName: "my-bucket",
          source: "test.txt",
          context: FIXTURE_DIR,
          branch: "master",
          maxVersions: 2,
        },
      };

      const plan = await createObjectsPlan(executors, undefined, state, config);

      const createVersionUnits = plan.filter((u) => u.type === Type.CreateVersion);
      expect(createVersionUnits.length).toBe(1);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ObjectState, typeof executors.deleteObject> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(1);
      expect(deleteVersionUnits[0].version).toBe("v1");
      expect(deleteVersionUnits[0].path).toBe("aws.s3.object.app.tar.gz");
    });

    it("should delete 2 oldest versions when maxVersions: 1 with 3 versions after CreateVersion", async () => {
      const executors = createExecutors();
      const v1State = makeObjectState("v1", "app.tar.gz", "my-bucket", "2025-01-01T00:00:00.000Z");
      const v2State = makeObjectState("v2", "app.tar.gz", "my-bucket", "2025-06-01T00:00:00.000Z");
      const v3State = makeObjectState("v3", "app.tar.gz", "my-bucket", "2025-12-01T00:00:00.000Z");

      const state = makeObjectsState("app.tar.gz", "v3", {
        v1: v1State,
        v2: v2State,
        v3: v3State,
      });

      // New version will be created → 4 projected versions. maxVersions: 1 → delete v1, v2, v3
      // But v3 is not current after plan (new version is current) so all 3 old are candidates
      // Actually: new version becomes current, so v1, v2, v3 are all non-current
      // Delete 3 excess versions (4 - 1 = 3)
      const config: ObjectsConfig = {
        "app.tar.gz": {
          bucketName: "my-bucket",
          source: "test.txt",
          context: FIXTURE_DIR,
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createObjectsPlan(executors, undefined, state, config);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ObjectState, typeof executors.deleteObject> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(3);

      // Oldest first
      const deletedVersions = deleteVersionUnits.map((u) => u.version);
      expect(deletedVersions).toContain("v1");
      expect(deletedVersions).toContain("v2");
      expect(deletedVersions).toContain("v3");
    });

    it("should never delete the current version", async () => {
      const executors = createExecutors();
      const v1State = makeObjectState("v1", "app.tar.gz", "my-bucket", "2025-01-01T00:00:00.000Z");
      const v2State = makeObjectState("v2", "app.tar.gz", "my-bucket", "2025-06-01T00:00:00.000Z");

      const state = makeObjectsState("app.tar.gz", "v2", {
        v1: v1State,
        v2: v2State,
      });

      // CreateVersion will make a new version current.
      // maxVersions: 1 → should delete v1 and v2 (both non-current after plan)
      // New version is current and protected.
      const config: ObjectsConfig = {
        "app.tar.gz": {
          bucketName: "my-bucket",
          source: "test.txt",
          context: FIXTURE_DIR,
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createObjectsPlan(executors, undefined, state, config);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ObjectState, typeof executors.deleteObject> => u.type === Type.DeleteVersion,
      );

      // v1 and v2 should be deleted, new version (from CreateVersion) is current and kept
      for (const unit of deleteVersionUnits) {
        // The new version from CreateVersion should never appear in delete list
        const createVersionUnit = plan.find(
          (u) => u.type === Type.CreateVersion,
        ) as CreateVersionUnit<ObjectConfig, ObjectState, typeof executors.createObject>;
        expect(unit.version).not.toBe(createVersionUnit.version);
      }
    });

    it("should not cleanup when creating first version with maxVersions set", async () => {
      const executors = createExecutors();
      const state: ObjectsState = {};

      const config: ObjectsConfig = {
        "app.tar.gz": {
          bucketName: "my-bucket",
          source: "test.txt",
          context: FIXTURE_DIR,
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createObjectsPlan(executors, undefined, state, config);

      const createVersionUnits = plan.filter((u) => u.type === Type.CreateVersion);
      expect(createVersionUnits.length).toBe(1);

      const deleteVersionUnits = plan.filter((u) => u.type === Type.DeleteVersion);
      expect(deleteVersionUnits.length).toBe(0);
    });

    it("should delete oldest when maxVersions: 1 with 2 versions (exact user scenario)", async () => {
      const executors = createExecutors();
      const v1State = makeObjectState("v1", "app.tar.gz", "my-bucket", "2025-01-01T00:00:00.000Z");
      const v2State = makeObjectState("v2", "app.tar.gz", "my-bucket", "2025-06-01T00:00:00.000Z");

      // v2 is current
      const state = makeObjectsState("app.tar.gz", "v2", {
        v1: v1State,
        v2: v2State,
      });

      // CreateVersion will add v3. Projected: v1, v2, v3 = 3. maxVersions: 1 → delete v1, v2
      const config: ObjectsConfig = {
        "app.tar.gz": {
          bucketName: "my-bucket",
          source: "test.txt",
          context: FIXTURE_DIR,
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createObjectsPlan(executors, undefined, state, config);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ObjectState, typeof executors.deleteObject> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(2);
      expect(deleteVersionUnits[0].version).toBe("v1");
      expect(deleteVersionUnits[1].version).toBe("v2");
    });

    it("should cleanup excess versions on noop when maxVersions is newly added", async () => {
      const executors = createExecutors();

      // Compute hash for the fixture so we can create a state version that matches
      const { createObject } = await import("../utils.ts");
      const { version: fixtureHash } = await createObject("app.tar.gz", {
        bucketName: "my-bucket",
        source: "test.txt",
        context: FIXTURE_DIR,
        branch: "master",
      } as ObjectConfig);

      const v1State = makeObjectState("v1", "app.tar.gz", "my-bucket", "2025-01-01T00:00:00.000Z");
      const currentState = makeObjectState(fixtureHash, "app.tar.gz", "my-bucket", "2025-06-01T00:00:00.000Z", {
        maxVersions: 1,
      });

      const state = makeObjectsState("app.tar.gz", fixtureHash, {
        v1: v1State,
        [fixtureHash]: currentState,
      });

      // Config matches current version → Noop, but v1 should be cleaned up
      const config: ObjectsConfig = {
        "app.tar.gz": {
          bucketName: "my-bucket",
          source: "test.txt",
          context: FIXTURE_DIR,
          branch: "master",
          maxVersions: 1,
        },
      };

      const plan = await createObjectsPlan(executors, undefined, state, config);

      const noopUnits = plan.filter((u) => u.type === Type.Noop);
      expect(noopUnits.length).toBe(1);

      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ObjectState, typeof executors.deleteObject> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(1);
      expect(deleteVersionUnits[0].version).toBe("v1");
    });

    it("should handle maxVersions: 2 with 3 versions and no config change (noop)", async () => {
      const executors = createExecutors();

      const { createObject } = await import("../utils.ts");
      const { version: fixtureHash } = await createObject("app.tar.gz", {
        bucketName: "my-bucket",
        source: "test.txt",
        context: FIXTURE_DIR,
        branch: "master",
      } as ObjectConfig);

      const v1State = makeObjectState("v1", "app.tar.gz", "my-bucket", "2025-01-01T00:00:00.000Z");
      const v2State = makeObjectState("v2", "app.tar.gz", "my-bucket", "2025-06-01T00:00:00.000Z");
      const currentState = makeObjectState(fixtureHash, "app.tar.gz", "my-bucket", "2025-12-01T00:00:00.000Z", {
        maxVersions: 2,
      });

      const state = makeObjectsState("app.tar.gz", fixtureHash, {
        v1: v1State,
        v2: v2State,
        [fixtureHash]: currentState,
      });

      const config: ObjectsConfig = {
        "app.tar.gz": {
          bucketName: "my-bucket",
          source: "test.txt",
          context: FIXTURE_DIR,
          branch: "master",
          maxVersions: 2,
        },
      };

      const plan = await createObjectsPlan(executors, undefined, state, config);

      const noopUnits = plan.filter((u) => u.type === Type.Noop);
      expect(noopUnits.length).toBe(1);

      // 3 versions with maxVersions: 2 → delete 1 oldest (v1)
      const deleteVersionUnits = plan.filter(
        (u): u is DeleteVersionUnit<ObjectState, typeof executors.deleteObject> => u.type === Type.DeleteVersion,
      );
      expect(deleteVersionUnits.length).toBe(1);
      expect(deleteVersionUnits[0].version).toBe("v1");
    });
  });
});
